import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { IdeaStatus, UserRole } from "./supabase";

/**
 * Combines multiple class names using clsx and tailwind-merge
 * Required by shadcn-ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a readable format
 * @param dateString ISO date string
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  if (!dateString) return "N/A";
  
  return new Intl.DateTimeFormat("en-US", options).format(new Date(dateString));
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 * @param dateString ISO date string
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds === 1 ? "" : "s"} ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
}

/**
 * Get the color variant for an idea status badge
 * @param status Idea status
 * @returns CSS class variant for the badge
 */
export function getStatusBadgeVariant(status: IdeaStatus | null | undefined): "default" | "secondary" | "destructive" | "outline" | "success" {
  if (!status) return "outline";
  
  switch (status) {
    case "draft":
      return "secondary"; // Gray
    case "submitted":
      return "default"; // Primary color (blue)
    case "approved":
      return "success"; // Green
    case "rejected":
      return "destructive"; // Red
    default:
      return "outline";
  }
}

/**
 * Get a human-readable label for an idea status
 * @param status Idea status
 * @returns Human-readable status label
 */
export function getStatusLabel(status: IdeaStatus | null | undefined): string {
  if (!status) return "Unknown";
  
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Under Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Needs Revision";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

/**
 * Get a human-readable label for a user role
 * @param role User role
 * @returns Human-readable role label
 */
export function getRoleLabel(role: UserRole | null | undefined): string {
  if (!role) return "Unknown";
  
  switch (role) {
    case "owner":
      return "Idea Owner";
    case "admin":
      return "Administrator";
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

/**
 * Truncate text to a specific length with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Check if a string is a valid URL
 * @param str String to check
 * @returns Boolean indicating if string is a valid URL
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Debounce a function call
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a random UUID
 * @returns Random UUID string
 */
export function generateUUID(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

/**
 * Extract tags from text content using common patterns
 * @param text Text to extract tags from
 * @returns Array of potential tags
 */
export function extractPotentialTags(text: string): string[] {
  if (!text) return [];
  
  // Extract hashtags
  const hashtagPattern = /#(\w+)/g;
  const hashtags = [...text.matchAll(hashtagPattern)].map(match => match[1]);
  
  // Extract keywords (words that appear multiple times)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Only words longer than 3 chars
  
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Get words that appear at least twice
  const keywords = Object.entries(wordCounts)
    .filter(([_, count]) => count >= 2)
    .map(([word]) => word);
  
  // Combine and deduplicate
  return [...new Set([...hashtags, ...keywords])].slice(0, 10);
}
