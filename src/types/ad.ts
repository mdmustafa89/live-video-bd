export type AdPosition = 'Header' | 'Homepage' | 'Between Videos' | 'Sidebar' | 'Footer';

export interface Advertisement {
  id: string;
  networkName: string; // e.g. "Google AdSense", "Media.net", "Custom Banner"
  placementName: string; // e.g. "Header Leaderboard 728x90", "In-Feed Banner"
  code: string; // HTML / JavaScript code
  position: AdPosition; // Header, Homepage, Between Videos, Sidebar, Footer
  enabled: boolean; // Enable/Disable Advertisement toggle
  createdAt: string;
  updatedAt: string;
  impressions?: number;
  clicks?: number;
}

export interface DatabaseStatus {
  isConfigured: boolean;
  type: 'local_json' | 'cloud_sql' | 'firestore' | 'none';
  label: string;
  description: string;
  storagePath?: string;
  recommendation: string;
}
