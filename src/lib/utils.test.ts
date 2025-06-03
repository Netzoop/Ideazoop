import { describe, it, expect, vi } from 'vitest';
import {
  formatDate,
  formatRelativeTime,
  truncateText,
  isValidUrl,
  getStatusLabel,
  getStatusBadgeVariant,
  cn,
  getRoleLabel,
  extractPotentialTags,
  debounce,
  generateUUID,
} from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('combines class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
      expect(cn('foo', { bar: false }, 'baz')).toBe('foo baz');
    });

    it('merges tailwind classes properly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('formatDate', () => {
    it('formats date strings correctly', () => {
      const date = '2023-01-15T12:00:00Z';
      expect(formatDate(date)).toMatch(/Jan 15, 2023/);
    });

    it('returns N/A for null or undefined dates', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('accepts custom formatting options', () => {
      const date = '2023-01-15T12:00:00Z';
      expect(formatDate(date, { year: 'numeric', month: 'long' })).toMatch(/January 2023/);
    });
  });

  describe('formatRelativeTime', () => {
    it('formats recent times as seconds ago', () => {
      const now = new Date();
      const tenSecondsAgo = new Date(now.getTime() - 10 * 1000);
      expect(formatRelativeTime(tenSecondsAgo.toISOString())).toMatch(/10 seconds ago/);
    });

    it('formats minutes ago correctly', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo.toISOString())).toMatch(/5 minutes ago/);
    });

    it('formats hours ago correctly', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo.toISOString())).toMatch(/2 hours ago/);
    });

    it('formats days ago correctly', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo.toISOString())).toMatch(/3 days ago/);
    });

    it('returns N/A for null or undefined dates', () => {
      expect(formatRelativeTime(null)).toBe('N/A');
      expect(formatRelativeTime(undefined)).toBe('N/A');
    });
  });

  describe('truncateText', () => {
    it('truncates text that exceeds max length', () => {
      const text = 'This is a long text that should be truncated';
      expect(truncateText(text, 10)).toBe('This is a...');
    });

    it('does not truncate text shorter than max length', () => {
      const text = 'Short text';
      expect(truncateText(text, 20)).toBe('Short text');
    });

    it('returns empty string for null or undefined input', () => {
      expect(truncateText(null, 10)).toBe('');
      expect(truncateText(undefined, 10)).toBe('');
    });
  });

  describe('isValidUrl', () => {
    it('returns true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://sub.domain.co.uk/path?query=param#hash')).toBe(true);
    });

    it('returns false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('www.example.com')).toBe(false);
    });
  });

  describe('getStatusLabel', () => {
    it('returns human-readable labels for idea statuses', () => {
      expect(getStatusLabel('draft')).toBe('Draft');
      expect(getStatusLabel('submitted')).toBe('Under Review');
      expect(getStatusLabel('approved')).toBe('Approved');
      expect(getStatusLabel('rejected')).toBe('Needs Revision');
    });

    it('returns Unknown for null or undefined status', () => {
      expect(getStatusLabel(null)).toBe('Unknown');
      expect(getStatusLabel(undefined)).toBe('Unknown');
    });
  });

  describe('getStatusBadgeVariant', () => {
    it('returns correct variant for each status', () => {
      expect(getStatusBadgeVariant('draft')).toBe('secondary');
      expect(getStatusBadgeVariant('submitted')).toBe('default');
      expect(getStatusBadgeVariant('approved')).toBe('success');
      expect(getStatusBadgeVariant('rejected')).toBe('destructive');
    });

    it('returns outline for null or undefined status', () => {
      expect(getStatusBadgeVariant(null)).toBe('outline');
      expect(getStatusBadgeVariant(undefined)).toBe('outline');
    });
  });

  describe('getRoleLabel', () => {
    it('returns human-readable labels for user roles', () => {
      expect(getRoleLabel('owner')).toBe('Idea Owner');
      expect(getRoleLabel('admin')).toBe('Administrator');
    });

    it('returns Unknown for null or undefined role', () => {
      expect(getRoleLabel(null)).toBe('Unknown');
      expect(getRoleLabel(undefined)).toBe('Unknown');
    });
  });

  describe('extractPotentialTags', () => {
    it('extracts hashtags from text', () => {
      const text = 'This contains #hashtag and #another tag';
      const tags = extractPotentialTags(text);
      expect(tags).toContain('hashtag');
      expect(tags).toContain('another');
    });

    it('extracts repeated words as potential tags', () => {
      const text = 'This innovation innovation project focuses on project management';
      const tags = extractPotentialTags(text);
      expect(tags).toContain('innovation');
      expect(tags).toContain('project');
    });

    it('returns empty array for empty input', () => {
      expect(extractPotentialTags('')).toEqual([]);
    });

    it('ignores words shorter than 4 characters', () => {
      const text = 'The cat and dog are pets';
      const tags = extractPotentialTags(text);
      expect(tags).not.toContain('the');
      expect(tags).not.toContain('cat');
      expect(tags).not.toContain('and');
      expect(tags).not.toContain('dog');
      expect(tags).not.toContain('are');
    });
  });

  describe('debounce', () => {
    it('delays function execution', async () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      vi.useRealTimers();
    });

    it('only executes once for multiple rapid calls', async () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      vi.useRealTimers();
    });
  });

  describe('generateUUID', () => {
    it('generates a valid UUID string', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('generates unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });
});
