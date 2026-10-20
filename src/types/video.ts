export interface VideoItem {
  id: string;
  title: string;
  titleEn?: string;
  channelName: string;
  category: string;
  categoryEn: string;
  views: string;
  uploadedAt: string;
  duration: string;
  thumbnail: string;
  videoUrl: string; // Direct mp4, uploaded video link, or YouTube embed
  youtubeId?: string; // Extracted 11-char YouTube Video ID
  sourceType?: 'youtube' | 'upload' | 'url'; // Source format
  isLive?: boolean;
  liveViewers?: string;
  description: string;
  tags?: string[];
  likes: number;
  published?: boolean; // Publish or unpublish toggle
  fileSize?: string;
  isUploadedFile?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VideoComment {
  id: string;
  author: string;
  avatarText: string;
  text: string;
  timestamp: string;
  likes: number;
}

export type Language = 'bn' | 'en';
