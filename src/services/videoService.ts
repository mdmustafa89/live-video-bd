import { VideoItem } from '../types/video';
import { AuthService } from './authService';
import { INITIAL_VIDEOS } from '../data/initialVideos';

export class VideoService {
  static async getVideos(): Promise<VideoItem[]> {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Backend /api/videos unavailable, using fallback:', err);
    }
    return INITIAL_VIDEOS;
  }

  static async getAllAdminVideos(): Promise<VideoItem[]> {
    const token = AuthService.getToken();
    if (token) {
      try {
        const res = await fetch('/api/admin/videos', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
        }
      } catch (err) {
        console.warn('Backend /api/admin/videos error:', err);
      }
    }
    return this.getVideos();
  }

  static async uploadFile(
    file: File,
    type: 'video' | 'image',
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; url?: string; formattedSize?: string; error?: string }> {
    const token = AuthService.getToken();
    if (!token) {
      return { success: false, error: 'Administrator authentication required to upload files.' };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };

      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              filename: file.name,
              data: base64Data,
              type,
            }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            resolve({
              success: true,
              url: data.url,
              formattedSize: data.formattedSize,
            });
          } else {
            resolve({ success: false, error: data.error || 'Upload failed on server' });
          }
        } catch {
          resolve({ success: false, error: 'Connection failure during file upload.' });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, error: 'Could not read file from device.' });
      };

      reader.readAsDataURL(file);
    });
  }

  static async addVideo(
    videoData: Partial<VideoItem>
  ): Promise<{ success: boolean; data?: VideoItem; error?: string }> {
    const token = AuthService.getToken();
    if (!token) {
      return {
        success: false,
        error: 'অননুমোদিত: শুধুমাত্র অ্যাডমিনিস্ট্রেটর নতুন ভিডিও আপলোড করতে পারেন (Admin authentication required)',
      };
    }

    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(videoData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error || 'Failed to add video' };
    } catch {
      return { success: false, error: 'সার্ভার সংযোগে ত্রুটি হয়েছে' };
    }
  }

  static async updateVideo(
    id: string,
    videoData: Partial<VideoItem>
  ): Promise<{ success: boolean; data?: VideoItem; error?: string }> {
    const token = AuthService.getToken();
    if (!token) {
      return { success: false, error: 'Admin authentication required.' };
    }

    try {
      const res = await fetch(`/api/admin/videos/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(videoData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error || 'Failed to update video' };
    } catch {
      return { success: false, error: 'Server connection failed.' };
    }
  }

  static async togglePublish(id: string): Promise<{ success: boolean; published?: boolean; error?: string }> {
    const token = AuthService.getToken();
    if (!token) return { success: false, error: 'Admin authentication required.' };

    try {
      const res = await fetch(`/api/admin/videos/${encodeURIComponent(id)}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, published: data.published };
      }
      return { success: false, error: data.error || 'Failed to toggle publish status' };
    } catch {
      return { success: false, error: 'Server connection failed.' };
    }
  }

  static async deleteVideo(id: string): Promise<{ success: boolean; error?: string }> {
    const token = AuthService.getToken();
    if (!token) {
      return { success: false, error: 'Admin authentication required.' };
    }

    try {
      const res = await fetch(`/api/admin/videos/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to delete video' };
    } catch {
      return { success: false, error: 'Server connection failed.' };
    }
  }
}
