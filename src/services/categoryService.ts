import { CategoryItem } from '../types/category';
import { AuthService } from './authService';

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'লাইভ স্ট্রিম', labelBn: 'লাইভ স্ট্রিম', labelEn: 'Live Stream', icon: 'Radio' },
  { id: 'নাটক', labelBn: 'নাটক', labelEn: 'Drama', icon: 'Film' },
  { id: 'গান ও সঙ্গীত', labelBn: 'গান ও সঙ্গীত', labelEn: 'Music', icon: 'Music' },
  { id: 'প্রযুক্তি', labelBn: 'প্রযুক্তি', labelEn: 'Technology', icon: 'Cpu' },
  { id: 'ডকুমেন্টারি', labelBn: 'ডকুমেন্টারি', labelEn: 'Documentary', icon: 'Compass' },
  { id: 'খাবার ও রেসিপি', labelBn: 'খাবার ও রেসিপি', labelEn: 'Food & Recipe', icon: 'Utensils' },
  { id: 'খেলাধুলা', labelBn: 'খেলাধুলা', labelEn: 'Sports', icon: 'Trophy' },
  { id: 'সংবাদ', labelBn: 'সংবাদ', labelEn: 'News', icon: 'Newspaper' },
];

export class CategoryService {
  static async getCategories(): Promise<CategoryItem[]> {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Backend /api/categories unavailable, using fallback:', err);
    }
    return INITIAL_CATEGORIES;
  }

  static async createCategory(cat: {
    id: string;
    labelBn: string;
    labelEn: string;
    description?: string;
  }): Promise<{ success: boolean; data?: CategoryItem; error?: string }> {
    const token = AuthService.getToken();
    if (!token) return { success: false, error: 'Admin authentication required.' };

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cat),
      });
      const data = await res.json();
      if (res.ok && data.success) return { success: true, data: data.data };
      return { success: false, error: data.error || 'Failed to create category' };
    } catch {
      return { success: false, error: 'Connection error' };
    }
  }

  static async updateCategory(
    id: string,
    cat: {
      labelBn?: string;
      labelEn?: string;
      newId?: string;
      description?: string;
    }
  ): Promise<{ success: boolean; data?: CategoryItem; error?: string }> {
    const token = AuthService.getToken();
    if (!token) return { success: false, error: 'Admin authentication required.' };

    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cat),
      });
      const data = await res.json();
      if (res.ok && data.success) return { success: true, data: data.data };
      return { success: false, error: data.error || 'Failed to update category' };
    } catch {
      return { success: false, error: 'Connection error' };
    }
  }

  static async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    const token = AuthService.getToken();
    if (!token) return { success: false, error: 'Admin authentication required.' };

    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) return { success: true };
      return { success: false, error: data.error || 'Failed to delete category' };
    } catch {
      return { success: false, error: 'Connection error' };
    }
  }
}
