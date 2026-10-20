export interface CategoryItem {
  id: string; // Used as key/value, e.g. "নাটক"
  labelBn: string;
  labelEn: string;
  icon?: string;
  description?: string;
  videoCount?: number;
  createdAt?: string;
}

export interface DashboardStats {
  totalVideos: number;
  publishedVideos: number;
  unpublishedVideos: number;
  totalCategories: number;
  totalAds: number;
  activeAds: number;
  totalTags: number;
}
