-- 001_initial_schema.sql
-- Initial database schema for Ideazoop platform

-- Enable RLS on all tables by default
alter database postgres set row_level_security = on;

-- Create enum types for roles and idea statuses
create type public.user_role as enum ('owner', 'admin');
create type public.idea_status as enum ('draft', 'submitted', 'approved', 'rejected');

-- PROFILES TABLE
-- Stores user profile information linked to auth.users
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'owner',
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles RLS policies
-- Users can view their own profile
create policy "Users can view own profile" 
  on public.profiles for select 
  using (id = auth.uid());

-- Users can update their own profile
create policy "Users can update own profile" 
  on public.profiles for update 
  using (id = auth.uid());

-- IDEAS TABLE
-- Stores ideas with their metadata and status
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  tags text[] default array[]::text[],
  status idea_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on ideas
alter table public.ideas enable row level security;

-- Ideas RLS policies
-- Owners can read their own ideas
create policy "Owners can read own ideas" 
  on public.ideas for select 
  using (owner_id = auth.uid());

-- Owners can insert their own ideas
create policy "Owners can insert own ideas" 
  on public.ideas for insert 
  with check (owner_id = auth.uid());

-- Owners can update their own ideas if in draft or rejected status
create policy "Owners can update own draft or rejected ideas" 
  on public.ideas for update 
  using (
    owner_id = auth.uid() 
    and (status = 'draft' or status = 'rejected')
  );

-- Owners can delete their own ideas if in draft status
create policy "Owners can delete own draft ideas" 
  on public.ideas for delete 
  using (
    owner_id = auth.uid() 
    and status = 'draft'
  );

-- Admins can read all ideas
create policy "Admins can read all ideas" 
  on public.ideas for select 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );

-- Admins can update status of submitted ideas
create policy "Admins can update status of submitted ideas" 
  on public.ideas for update 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  )
  with check (
    -- Only allow updating status field
    owner_id = owner_id 
    and title = title 
    and description = description 
    and tags = tags
  );

-- COMMENTS TABLE
-- Stores comments on ideas
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS on comments
alter table public.comments enable row level security;

-- Comments RLS policies
-- Users can insert comments (as author)
create policy "Users can insert comments" 
  on public.comments for insert 
  with check (author_id = auth.uid());

-- Users can read comments if they're the author, idea owner, or admin
create policy "Users can read comments if participant" 
  on public.comments for select 
  using (
    author_id = auth.uid()
    or idea_id in (
      select id from public.ideas 
      where owner_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );

-- NOTIFICATIONS TABLE
-- Stores notifications for users
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  type text not null,
  meta jsonb default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS on notifications
alter table public.notifications enable row level security;

-- Notifications RLS policies
-- Users can only see their own notifications
create policy "Users can only see own notifications" 
  on public.notifications for select 
  using (user_id = auth.uid());

-- Users can only update (mark as read) their own notifications
create policy "Users can only update own notifications" 
  on public.notifications for update 
  using (user_id = auth.uid());

-- OPENAI_LOGS TABLE
-- Stores logs of OpenAI API usage for audit and rate limiting
create table public.openai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt text not null,
  response jsonb not null,
  created_at timestamptz not null default now()
);

-- Enable RLS on openai_logs
alter table public.openai_logs enable row level security;

-- OpenAI logs RLS policies
-- Users can see their own OpenAI logs
create policy "Users can see own OpenAI logs" 
  on public.openai_logs for select 
  using (user_id = auth.uid());

-- Admins can see all OpenAI logs
create policy "Admins can see all OpenAI logs" 
  on public.openai_logs for select 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );

-- TRIGGERS

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles(id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url',
    'owner'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to auto-create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to auto-update updated_at on ideas table
create trigger on_idea_updated
  before update on public.ideas
  for each row execute procedure public.handle_updated_at();

-- Create trigger to auto-update updated_at on profiles table
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Notification trigger for new comments
create or replace function public.handle_new_comment()
returns trigger as $$
declare
  idea_owner_id uuid;
  comment_author_role user_role;
  notification_type text;
begin
  -- Get the idea owner
  select owner_id into idea_owner_id
  from public.ideas
  where id = new.idea_id;
  
  -- Get the comment author role
  select role into comment_author_role
  from public.profiles
  where id = new.author_id;
  
  -- Set notification type based on author role
  if comment_author_role = 'admin' then
    notification_type := 'admin_comment';
  else
    notification_type := 'user_comment';
  end if;
  
  -- Create notification for idea owner if commenter is not the owner
  if new.author_id <> idea_owner_id then
    insert into public.notifications(user_id, idea_id, type, meta)
    values (
      idea_owner_id,
      new.idea_id,
      notification_type,
      jsonb_build_object(
        'comment_id', new.id,
        'author_id', new.author_id
      )
    );
  end if;
  
  -- If commenter is not admin, also notify all admins
  if comment_author_role <> 'admin' then
    insert into public.notifications(user_id, idea_id, type, meta)
    select 
      p.id,
      new.idea_id,
      'new_comment',
      jsonb_build_object(
        'comment_id', new.id,
        'author_id', new.author_id
      )
    from public.profiles p
    where p.role = 'admin';
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for comment notifications
create trigger on_comment_created
  after insert on public.comments
  for each row execute procedure public.handle_new_comment();

-- Notification trigger for idea status changes
create or replace function public.handle_idea_status_change()
returns trigger as $$
begin
  if old.status <> new.status then
    -- Notify the idea owner about the status change
    insert into public.notifications(user_id, idea_id, type, meta)
    values (
      new.owner_id,
      new.id,
      'status_change',
      jsonb_build_object(
        'old_status', old.status,
        'new_status', new.status
      )
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for idea status change notifications
create trigger on_idea_status_changed
  after update of status on public.ideas
  for each row execute procedure public.handle_idea_status_change();

-- Create indexes for performance
create index idx_ideas_owner_id on public.ideas(owner_id);
create index idx_ideas_status on public.ideas(status);
create index idx_comments_idea_id on public.comments(idea_id);
create index idx_comments_author_id on public.comments(author_id);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_read on public.notifications(read);
create index idx_openai_logs_user_id on public.openai_logs(user_id);
create index idx_openai_logs_created_at on public.openai_logs(created_at);

-- Create admin user function (to be called manually after setup)
create or replace function public.create_admin_user(email text, password text)
returns uuid as $$
declare
  new_user_id uuid;
begin
  -- Create user in auth.users
  insert into auth.users (email, password)
  values (email, crypt(password, gen_salt('bf')))
  returning id into new_user_id;
  
  -- Update the user's role to admin
  update public.profiles
  set role = 'admin'
  where id = new_user_id;
  
  return new_user_id;
end;
$$ language plpgsql security definer;

-- Create function to get dashboard counts
create or replace function public.get_dashboard_counts(user_id uuid)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'draft_count', (select count(*) from public.ideas where owner_id = user_id and status = 'draft'),
    'submitted_count', (select count(*) from public.ideas where owner_id = user_id and status = 'submitted'),
    'approved_count', (select count(*) from public.ideas where owner_id = user_id and status = 'approved'),
    'rejected_count', (select count(*) from public.ideas where owner_id = user_id and status = 'rejected'),
    'total_count', (select count(*) from public.ideas where owner_id = user_id)
  ) into result;
  
  return result;
end;
$$ language plpgsql security definer;

-- Create function to get admin dashboard counts
create or replace function public.get_admin_dashboard_counts()
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'draft_count', (select count(*) from public.ideas where status = 'draft'),
    'submitted_count', (select count(*) from public.ideas where status = 'submitted'),
    'approved_count', (select count(*) from public.ideas where status = 'approved'),
    'rejected_count', (select count(*) from public.ideas where status = 'rejected'),
    'total_count', (select count(*) from public.ideas),
    'pending_review_count', (select count(*) from public.ideas where status = 'submitted')
  ) into result;
  
  return result;
end;
$$ language plpgsql security definer;
