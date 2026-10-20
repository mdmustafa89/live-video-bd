import { DashboardStats } from '../types/category';
import { AuthService } from './authService';

export interface TagItem {
  tag: string;
  count: number;
}

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    const token = AuthService.getToken();
    if (!token) {
      return {
        totalVideos: 0,
        publishedVideos: 0,
        unpublishedVideos: 0,
        totalCategories: 0,
        totalAds: 0,
        activeAds: 0,
        totalTags: 0,
      };
    }

    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return json.data;
      }
    } catch (err) {
      console.warn('Failed to fetch admin stats:', err);
    }

    return {
      totalVideos: 0,
      publishedVideos: 0,
      unpublishedVideos: 0,
      totalCategories: 0,
      totalAds: 0,
      activeAds: 0,
      totalTags: 0,
    };
  }

  static async getTags(): Promise<TagItem[]> {
    try {
      const res = await fetch('/api/tags');
      const json = await res.json();
      if (res.ok && json.success) {
        return json.data;
      }
    } catch (err) {
      console.warn('Failed to fetch tags:', err);
    }
    return [];
  }

  static async renameTag(oldTag: string, newTag: string): Promise<boolean> {
    const token = AuthService.getToken();
    if (!token) return false;

    try {
      const res = await fetch('/api/admin/tags/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldTag, newTag }),
      });
      const json = await res.json();
      return Boolean(res.ok && json.success);
    } catch {
      return false;
    }
  }

  static async deleteTag(tag: string): Promise<boolean> {
    const token = AuthService.getToken();
    if (!token) return false;

    try {
      const res = await fetch(`/api/admin/tags/${encodeURIComponent(tag)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return Boolean(res.ok && json.success);
    } catch {
      return false;
    }
  }
}
