import { Advertisement, DatabaseStatus, AdPosition } from '../types/ad';
import { INITIAL_ADVERTISEMENTS } from '../data/initialAds';
import { AuthService } from './authService';

export class AdService {
  static getAdminToken(): string | null {
    return AuthService.getToken();
  }

  static async getPublicAds(): Promise<Advertisement[]> {
    try {
      const res = await fetch('/api/ads');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Backend /api/ads unavailable, using initial:', err);
    }

    return INITIAL_ADVERTISEMENTS.filter((a) => a.enabled);
  }

  static async getAllAds(): Promise<Advertisement[]> {
    const token = this.getAdminToken();
    if (token) {
      try {
        const res = await fetch('/api/admin/ads', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
        }
      } catch (err) {
        console.warn('Backend /api/admin/ads error:', err);
      }
    }

    return INITIAL_ADVERTISEMENTS;
  }

  static async saveAd(adData: {
    id?: string;
    networkName: string;
    placementName: string;
    code: string;
    position: AdPosition;
    enabled: boolean;
  }): Promise<{ success: boolean; data?: Advertisement; error?: string }> {
    const token = this.getAdminToken();
    if (!token) {
      return { success: false, error: 'Administrator authentication required.' };
    }

    const isEdit = Boolean(adData.id);
    const endpoint = isEdit ? `/api/admin/ads/${adData.id}` : '/api/admin/ads';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(adData),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, data: json.data };
      }
      return { success: false, error: json.error || 'Failed to save advertisement' };
    } catch {
      return { success: false, error: 'Failed to communicate with server.' };
    }
  }

  static async toggleAd(id: string): Promise<boolean> {
    const token = this.getAdminToken();
    if (token) {
      try {
        const res = await fetch(`/api/admin/ads/${id}/toggle`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn('Backend toggle failed:', err);
      }
    }
    return false;
  }

  static async deleteAd(id: string): Promise<boolean> {
    const token = this.getAdminToken();
    if (token) {
      try {
        const res = await fetch(`/api/admin/ads/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn('Backend delete failed:', err);
      }
    }
    return false;
  }

  static async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch database status:', err);
    }

    return {
      isConfigured: true,
      type: 'local_json',
      label: 'Local File Database (data/admin.json, data/ads.json, data/videos.json)',
      description:
        'বিজ্ঞাপন ও ভিডিও সেটিংস ব্যাকএন্ডে সংরক্ষিত। ডিস্ট্রিবিউটেড ক্লাউড এনভায়রনমেন্টের জন্য ক্লাউড এসকিউএল বা ফায়ারবেস কনফিগার করা যেতে পারে।',
      storagePath: '/data/ads.json',
      recommendation:
        'For permanent multi-instance cloud clustering, attach Cloud SQL or Firebase Firestore.',
    };
  }
}
