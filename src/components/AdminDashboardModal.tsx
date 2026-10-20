import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Layers,
  Film,
  Plus,
  Trash2,
  Edit3,
  Power,
  RefreshCw,
  Eye,
  Check,
  CheckCircle,
  UploadCloud,
  FileVideo,
  Image as ImageIcon,
  Tag as TagIcon,
  FolderPlus,
  Sliders,
  Database,
  Lock,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  Search,
  Sparkles,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { VideoItem, Language } from '../types/video';
import { CategoryItem, DashboardStats } from '../types/category';
import { Advertisement, AdPosition, DatabaseStatus } from '../types/ad';
import { VideoService } from '../services/videoService';
import { CategoryService } from '../services/categoryService';
import { DashboardService, TagItem } from '../services/dashboardService';
import { AdService } from '../services/adService';
import { AuthService } from '../services/authService';
import { SandboxedAd } from './SandboxedAd';
import {
  extractYouTubeId,
  getYouTubeThumbnailUrl,
  fetchYouTubeMetadata,
} from '../utils/youtube';

interface AdminDashboardModalProps {
  onClose: () => void;
  onRefreshPublicData: () => void;
  onRequestChangePassword: () => void;
  lang: Language;
  initialTab?: 'overview' | 'videos' | 'categories' | 'tags' | 'ads' | 'security';
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  onClose,
  onRefreshPublicData,
  onRequestChangePassword,
  lang,
  initialTab = 'overview',
}) => {
  const isBn = lang === 'bn';

  // Navigation Tabs: 'overview' | 'videos' | 'categories' | 'tags' | 'ads' | 'security'
  const [activeTab, setActiveTab] = useState<
    'overview' | 'videos' | 'categories' | 'tags' | 'ads' | 'security'
  >(initialTab);

  // Stats
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    publishedVideos: 0,
    unpublishedVideos: 0,
    totalCategories: 0,
    totalAds: 0,
    activeAds: 0,
    totalTags: 0,
  });

  // Data lists
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ---------------- VIDEO FORM STATE ----------------
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoCategory, setVideoCategory] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [videoDuration, setVideoDuration] = useState('১০:১৫');
  const [videoChannel, setVideoChannel] = useState('Live Video Official');
  const [videoTagsInput, setVideoTagsInput] = useState('');
  const [videoPublished, setVideoPublished] = useState(true);
  const [videoIsLive, setVideoIsLive] = useState(false);

  // YouTube Specific States
  const [videoSourceMode, setVideoSourceMode] = useState<'youtube' | 'file'>('youtube');
  const [detectedYtId, setDetectedYtId] = useState<string | null>(null);
  const [fetchingYtMeta, setFetchingYtMeta] = useState(false);

  // Upload Progress & Errors
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [thumbUploadProgress, setThumbUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [videoSubmitting, setVideoSubmitting] = useState(false);

  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const thumbFileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle YouTube URL change & metadata auto-fetch
  const handleYouTubeUrlChange = async (url: string) => {
    setVideoUrl(url);
    const id = extractYouTubeId(url);
    setDetectedYtId(id);
    if (id) {
      // Auto-set thumbnail to YouTube thumbnail if not already customized
      if (!videoThumbnail || videoThumbnail.includes('hero_stream_cinema') || videoThumbnail.includes('youtube')) {
        setVideoThumbnail(getYouTubeThumbnailUrl(id, 'hq'));
      }
      setFetchingYtMeta(true);
      try {
        const meta = await fetchYouTubeMetadata(url);
        if (meta) {
          if (meta.title && (!videoTitle || videoTitle.trim() === '')) {
            setVideoTitle(meta.title);
          }
          if (meta.authorName && (!videoChannel || videoChannel === 'Live Video Official')) {
            setVideoChannel(meta.authorName);
          }
          if (meta.thumbnail && (!videoThumbnail || videoThumbnail.includes('hero_stream_cinema'))) {
            setVideoThumbnail(meta.thumbnail);
          }
        }
      } catch (err) {
        console.warn('YouTube metadata auto-fetch error:', err);
      } finally {
        setFetchingYtMeta(false);
      }
    }
  };

  // ---------------- CATEGORY FORM STATE ----------------
  const [newCatLabelBn, setNewCatLabelBn] = useState('');
  const [newCatLabelEn, setNewCatLabelEn] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // ---------------- TAG RENAME STATE ----------------
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagValue, setNewTagValue] = useState('');

  // ---------------- ADS FORM STATE ----------------
  const [adEditingId, setAdEditingId] = useState<string | null>(null);
  const [adNetworkName, setAdNetworkName] = useState('');
  const [adPlacementName, setAdPlacementName] = useState('');
  const [adCode, setAdCode] = useState('');
  const [adPosition, setAdPosition] = useState<AdPosition>('Header');
  const [adEnabled, setAdEnabled] = useState(true);
  const [adShowPreview, setAdShowPreview] = useState(false);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Load all admin data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, videosList, categoriesList, tagsList, adsList, dbData] =
        await Promise.all([
          DashboardService.getStats(),
          VideoService.getAllAdminVideos(),
          CategoryService.getCategories(),
          DashboardService.getTags(),
          AdService.getAllAds(),
          AdService.getDatabaseStatus(),
        ]);

      setStats(statsData);
      setVideos(videosList);
      setCategories(categoriesList);
      setTags(tagsList);
      setAds(adsList);
      setDbStatus(dbData);
      if (categoriesList.length > 0 && !videoCategory) {
        setVideoCategory(categoriesList[0].id);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // ---------------- VIDEO ACTIONS ----------------
  const handleOpenAddVideo = () => {
    setEditingVideoId(null);
    setVideoSourceMode('youtube');
    setDetectedYtId(null);
    setVideoTitle('');
    setVideoDescription('');
    setVideoCategory(categories[0]?.id || 'নাটক');
    setVideoUrl('');
    setVideoThumbnail('');
    setVideoDuration('YouTube');
    setVideoChannel('Live Video Official');
    setVideoTagsInput('');
    setVideoPublished(true);
    setVideoIsLive(false);
    setUploadError(null);
    setVideoUploadProgress(null);
    setThumbUploadProgress(null);
    setVideoModalOpen(true);
  };

  const handleOpenEditVideo = (v: VideoItem) => {
    setEditingVideoId(v.id);
    const yt = v.youtubeId || extractYouTubeId(v.videoUrl);
    setDetectedYtId(yt);
    setVideoSourceMode(yt ? 'youtube' : 'file');
    setVideoTitle(v.title);
    setVideoDescription(v.description || '');
    setVideoCategory(v.category);
    setVideoUrl(v.videoUrl);
    setVideoThumbnail(v.thumbnail);
    setVideoDuration(v.duration || (yt ? 'YouTube' : '১০:০০'));
    setVideoChannel(v.channelName || 'Live Video Official');
    setVideoTagsInput(Array.isArray(v.tags) ? v.tags.join(', ') : '');
    setVideoPublished(v.published !== false);
    setVideoIsLive(Boolean(v.isLive));
    setUploadError(null);
    setVideoUploadProgress(null);
    setThumbUploadProgress(null);
    setVideoModalOpen(true);
  };

  // Upload video file directly from phone/computer
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setVideoUploadProgress(10);

    const res = await VideoService.uploadFile(file, 'video', (p) => {
      setVideoUploadProgress(p);
    });

    if (res.success && res.url) {
      setVideoUrl(res.url);
      setVideoUploadProgress(100);
      showToast(isBn ? 'ভিডিও ফাইল সফলভাবে আপলোড হয়েছে!' : 'Video file uploaded successfully!');
    } else {
      setUploadError(res.error || (isBn ? 'ভিডিও আপলোড ব্যর্থ হয়েছে।' : 'Upload failed.'));
      setVideoUploadProgress(null);
    }
  };

  // Upload thumbnail image directly from phone/computer
  const handleThumbFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setThumbUploadProgress(10);

    const res = await VideoService.uploadFile(file, 'image', (p) => {
      setThumbUploadProgress(p);
    });

    if (res.success && res.url) {
      setVideoThumbnail(res.url);
      setThumbUploadProgress(100);
      showToast(isBn ? 'থাম্বনেইল ইমেজ আপলোড হয়েছে!' : 'Thumbnail image uploaded!');
    } else {
      setUploadError(res.error || (isBn ? 'থাম্বনেইল আপলোড ব্যর্থ হয়েছে।' : 'Upload failed.'));
      setThumbUploadProgress(null);
    }
  };

  // Submit Video
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      setUploadError(isBn ? 'ভিডিও শিরোনাম দিন।' : 'Title is required.');
      return;
    }
    if (!videoUrl.trim()) {
      setUploadError(isBn ? 'ভিডিও ফাইল আপলোড করুন অথবা ভিডিও লিংক দিন।' : 'Video URL or upload is required.');
      return;
    }

    if (videoSourceMode === 'youtube') {
      const yt = extractYouTubeId(videoUrl);
      if (!yt) {
        setUploadError(
          isBn
            ? 'সঠিক ইউটিউব ভিডিও লিংক প্রদান করুন (যেমন: https://www.youtube.com/watch?v=... বা https://youtu.be/...)'
            : 'Please enter a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)'
        );
        return;
      }
    }

    const matchedCat = categories.find((c) => c.id === videoCategory);
    const parsedTags = videoTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const ytId = extractYouTubeId(videoUrl);
    const payload: Partial<VideoItem> = {
      title: videoTitle.trim(),
      description: videoDescription.trim(),
      category: videoCategory,
      categoryEn: matchedCat ? matchedCat.labelEn : 'General',
      videoUrl: videoUrl.trim(),
      youtubeId: ytId || undefined,
      sourceType: ytId ? 'youtube' : videoFileInputRef.current?.files?.[0] ? 'upload' : 'url',
      thumbnail:
        videoThumbnail.trim() ||
        (ytId ? getYouTubeThumbnailUrl(ytId, 'hq') : '/src/assets/images/hero_stream_cinema_1792327536011.jpg'),
      duration: videoDuration.trim() || (ytId ? 'YouTube' : '১০:০০'),
      channelName: videoChannel.trim() || 'Live Video Official',
      tags: parsedTags.length > 0 ? parsedTags : ['Video', videoCategory],
      published: videoPublished,
      isLive: videoIsLive,
    };

    setVideoSubmitting(true);
    try {
      if (editingVideoId) {
        const res = await VideoService.updateVideo(editingVideoId, payload);
        if (res.success) {
          showToast(isBn ? 'ভিডিও আপডেট সম্পন্ন হয়েছে!' : 'Video updated successfully!');
          setVideoModalOpen(false);
          await loadDashboardData();
          onRefreshPublicData();
        } else {
          setUploadError(res.error || 'Failed to update video');
        }
      } else {
        const res = await VideoService.addVideo(payload);
        if (res.success) {
          showToast(isBn ? 'নতুন ভিডিও সফলভাবে প্রকাশিত হয়েছে!' : 'New video published!');
          setVideoModalOpen(false);
          await loadDashboardData();
          onRefreshPublicData();
        } else {
          setUploadError(res.error || 'Failed to publish video');
        }
      }
    } catch {
      setUploadError('Server communication error.');
    } finally {
      setVideoSubmitting(false);
    }
  };

  // Toggle publish / unpublish
  const handleTogglePublish = async (id: string) => {
    const res = await VideoService.togglePublish(id);
    if (res.success) {
      showToast(
        res.published
          ? isBn ? 'ভিডিওটি প্রকাশিত (Published) করা হয়েছে।' : 'Video published.'
          : isBn ? 'ভিডিওটি ড্রাফট (Unpublished) করা হয়েছে।' : 'Video unpublished.'
      );
      await loadDashboardData();
      onRefreshPublicData();
    }
  };

  // Delete Video
  const handleDeleteVideo = async (id: string, title: string) => {
    const confirmMsg = isBn
      ? `আপনি কি নিশ্চিতভাবে "${title}" ভিডিওটি স্থায়ীভাবে মুছে ফেলতে চান?`
      : `Are you sure you want to delete "${title}" permanently?`;

    if (window.confirm(confirmMsg)) {
      const res = await VideoService.deleteVideo(id);
      if (res.success) {
        showToast(isBn ? 'ভিডিওটি মুছে ফেলা হয়েছে।' : 'Video deleted.');
        await loadDashboardData();
        onRefreshPublicData();
      }
    }
  };

  // ---------------- CATEGORY ACTIONS ----------------
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabelBn.trim() && !newCatLabelEn.trim()) return;

    const res = await CategoryService.createCategory({
      id: newCatLabelBn.trim() || newCatLabelEn.trim(),
      labelBn: newCatLabelBn.trim() || newCatLabelEn.trim(),
      labelEn: newCatLabelEn.trim() || newCatLabelBn.trim(),
    });

    if (res.success) {
      showToast(isBn ? 'নতুন ক্যাটাগরি যুক্ত হয়েছে!' : 'Category created!');
      setNewCatLabelBn('');
      setNewCatLabelEn('');
      await loadDashboardData();
      onRefreshPublicData();
    } else {
      showToast(res.error || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (
      window.confirm(
        isBn
          ? `ক্যাটাগরি "${name}" মুছে ফেলতে চান? সংশ্লিষ্ট ভিডিওগুলোর ক্যাটাগরি অন্যটিতে পরিবর্তন করা উচিত।`
          : `Delete category "${name}"?`
      )
    ) {
      const res = await CategoryService.deleteCategory(id);
      if (res.success) {
        showToast(isBn ? 'ক্যাটাগরি মুছে ফেলা হয়েছে।' : 'Category deleted.');
        await loadDashboardData();
        onRefreshPublicData();
      } else {
        showToast(res.error || 'Failed to delete category');
      }
    }
  };

  // ---------------- TAG ACTIONS ----------------
  const handleRenameTag = async (oldTag: string) => {
    if (!newTagValue.trim() || newTagValue === oldTag) return;
    const ok = await DashboardService.renameTag(oldTag, newTagValue.trim());
    if (ok) {
      showToast(isBn ? 'ট্যাগ সফলভাবে পরিবর্তন করা হয়েছে।' : 'Tag renamed.');
      setEditingTag(null);
      setNewTagValue('');
      await loadDashboardData();
      onRefreshPublicData();
    }
  };

  const handleDeleteTag = async (tag: string) => {
    if (window.confirm(isBn ? `"${tag}" ট্যাগটি সব ভিডিও থেকে মুছে ফেলতে চান?` : `Remove tag "${tag}"?`)) {
      const ok = await DashboardService.deleteTag(tag);
      if (ok) {
        showToast(isBn ? 'ট্যাগ মুছে ফেলা হয়েছে।' : 'Tag removed.');
        await loadDashboardData();
        onRefreshPublicData();
      }
    }
  };

  // ---------------- ADVERTISEMENT ACTIONS ----------------
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adNetworkName.trim() || !adPlacementName.trim() || !adCode.trim()) {
      showToast(isBn ? 'বিজ্ঞাপনের সব ফিল্ড পূরণ করুন।' : 'All ad fields are required.');
      return;
    }

    const res = await AdService.saveAd({
      id: adEditingId || undefined,
      networkName: adNetworkName.trim(),
      placementName: adPlacementName.trim(),
      code: adCode.trim(),
      position: adPosition,
      enabled: adEnabled,
    });

    if (res.success) {
      showToast(isBn ? 'বিজ্ঞাপন সফলভাবে সংরক্ষিত হয়েছে!' : 'Advertisement saved!');
      setAdEditingId(null);
      setAdNetworkName('');
      setAdPlacementName('');
      setAdCode('');
      setAdPosition('Header');
      setAdEnabled(true);
      setAdShowPreview(false);
      await loadDashboardData();
      onRefreshPublicData();
    } else {
      showToast(res.error || 'Failed to save ad');
    }
  };

  const handleEditAd = (ad: Advertisement) => {
    setAdEditingId(ad.id);
    setAdNetworkName(ad.networkName);
    setAdPlacementName(ad.placementName);
    setAdCode(ad.code);
    setAdPosition(ad.position);
    setAdEnabled(ad.enabled);
    setAdShowPreview(false);
  };

  const handleToggleAd = async (id: string) => {
    await AdService.toggleAd(id);
    await loadDashboardData();
    onRefreshPublicData();
  };

  const handleDeleteAd = async (id: string, name: string) => {
    if (window.confirm(isBn ? `বিজ্ঞাপন "${name}" মুছে ফেলতে চান?` : `Delete ad "${name}"?`)) {
      await AdService.deleteAd(id);
      await loadDashboardData();
      onRefreshPublicData();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      <div className="relative w-full max-w-7xl bg-[#0f121d] border border-[#252c3f] rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[95vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#141825] border-b border-[#242b3e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff3155] to-[#99152e] flex items-center justify-center text-white shadow-lg shadow-[#ff3155]/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="dashboard-modal-title" className="text-base md:text-lg font-black text-white leading-tight">
                  LIVE VIDEO <span className="text-[#ff3155]">ADMIN DASHBOARD</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  {isBn ? 'সক্রিয় অ্যাডমিন' : 'Active Admin'}
                </span>
              </div>
              <p className="text-xs text-[#a5adbd]">
                {isBn
                  ? 'ভিডিও, ক্যাটাগরি, ট্যাগ ও বিজ্ঞাপন সম্পূর্ণ নিয়ন্ত্রণের পেশাদার ড্যাশবোর্ড'
                  : 'Enterprise management for videos, categories, tags, and advertisements'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRequestChangePassword}
              className="px-3 py-1.5 rounded-lg bg-[#1f2638] hover:bg-[#28324a] text-xs font-semibold text-[#c4c9d5] hover:text-white transition-colors flex items-center gap-1.5"
              title="Change Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#ff3155]" />
              <span className="hidden md:inline">{isBn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#a5adbd] hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast alert */}
        {toastMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#21283c] bg-[#111420] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#ff3155] text-white'
                : 'border-transparent text-[#8d97ac] hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-[#ff3155]" />
            <span>{isBn ? 'ওভারভিউ (Overview)' : 'Overview'}</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`px-3.5 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'videos'
                ? 'border-[#ff3155] text-white'
                : 'border-transparent text-[#8d97ac] hover:text-white'
            }`}
          >
            <Film className="w-4 h-4 text-[#ff3155]" />
            <span>{isBn ? 'ভিডিও ব্যবস্থাপনা (Videos)' : 'Videos'}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#ff3155]/20 text-[#ff3155] text-[10px] font-bold">
              {stats.totalVideos}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-[#ff3155] text-white'
                : 'border-transparent text-[#8d97ac] hover:text-white'
            }`}
          >
            <FolderPlus className="w-4 h-4 text-[#ff3155]" />
            <span>{isBn ? 'ক্যাটাগরি (Categories)' : 'Categories'}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#242b3e] text-[#c4c9d5] text-[10px] font-bold">
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tags')}
            className={`px-3.5 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tags'
                ? 'border-[#ff3155] text-white'
                : 'border-transparent text-[#8d97ac] hover:text-white'
            }`}
          >
            <TagIcon className="w-4 h-4 text-[#ff3155]" />
            <span>{isBn ? 'ট্যাগস (Tags)' : 'Tags'}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#242b3e] text-[#c4c9d5] text-[10px] font-bold">
              {tags.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`px-3.5 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ads'
                ? 'border-[#ff3155] text-white'
                : 'border-transparent text-[#8d97ac] hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4 text-[#ff3155]" />
            <span>{isBn ? 'বিজ্ঞাপন (Ads)' : 'Advertisements'}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#242b3e] text-[#c4c9d5] text-[10px] font-bold">
              {ads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-[#ff3155] text-white'
                : 'border-transparent text-[#8d97ac] hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>{isBn ? 'ডাটাবেস ও সিকিউরিটি' : 'Database & Security'}</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* ===================== TAB 1: OVERVIEW ===================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#141926] border border-[#252d40] rounded-2xl p-4 md:p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#8e99ae]">
                    <span>{isBn ? 'মোট ভিডিও' : 'Total Videos'}</span>
                    <Film className="w-4 h-4 text-[#ff3155]" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-white">
                    {stats.totalVideos}
                  </div>
                  <div className="text-[11px] text-[#7d879c] flex items-center gap-2">
                    <span className="text-emerald-400 font-semibold">{stats.publishedVideos} {isBn ? 'প্রকাশিত' : 'published'}</span>
                    <span>·</span>
                    <span className="text-amber-400 font-semibold">{stats.unpublishedVideos} {isBn ? 'ড্রাফট' : 'drafts'}</span>
                  </div>
                </div>

                <div className="bg-[#141926] border border-[#252d40] rounded-2xl p-4 md:p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#8e99ae]">
                    <span>{isBn ? 'প্রকাশিত ভিডিও' : 'Published Videos'}</span>
                    <Eye className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-white">
                    {stats.publishedVideos}
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    {isBn ? 'হোমপেজে দর্শনার্থীদের জন্য উন্মুক্ত' : 'Live on public homepage'}
                  </div>
                </div>

                <div className="bg-[#141926] border border-[#252d40] rounded-2xl p-4 md:p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#8e99ae]">
                    <span>{isBn ? 'মোট ক্যাটাগরি' : 'Total Categories'}</span>
                    <FolderPlus className="w-4 h-4 text-[#ff3155]" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-white">
                    {stats.totalCategories}
                  </div>
                  <div className="text-[11px] text-[#7d879c]">
                    {tags.length} {isBn ? 'টি অনন্য সার্চ ট্যাগ' : 'searchable tags'}
                  </div>
                </div>

                <div className="bg-[#141926] border border-[#252d40] rounded-2xl p-4 md:p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#8e99ae]">
                    <span>{isBn ? 'বিজ্ঞাপন স্লট' : 'Ad Placements'}</span>
                    <Sliders className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-white">
                    {stats.totalAds}
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    {stats.activeAds} {isBn ? 'টি সক্রিয় বিজ্ঞাপন চলমান' : 'active ads running'}
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-[#141926] border border-[#252d40] rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff3155]" />
                  <span>{isBn ? 'দ্রুত অ্যাকশন (Quick Actions)' : 'Quick Actions'}</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      handleOpenAddVideo();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#ff3155] hover:bg-[#e62245] text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#ff3155]/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isBn ? 'নতুন ভিডিও আপলোড করুন' : 'Upload Video from Phone/PC'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('categories')}
                    className="px-4 py-2.5 rounded-xl bg-[#1c2234] hover:bg-[#252c42] text-white text-xs md:text-sm font-semibold border border-[#2e374e] flex items-center gap-2 transition-colors"
                  >
                    <FolderPlus className="w-4 h-4 text-[#ff3155]" />
                    <span>{isBn ? 'ক্যাটাগরি তৈরি / সম্পাদনা' : 'Manage Categories'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('ads')}
                    className="px-4 py-2.5 rounded-xl bg-[#1c2234] hover:bg-[#252c42] text-white text-xs md:text-sm font-semibold border border-[#2e374e] flex items-center gap-2 transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-[#ff3155]" />
                    <span>{isBn ? 'বিজ্ঞাপন কোড কনফিগার করুন' : 'Configure Ads'}</span>
                  </button>

                  <button
                    onClick={onRequestChangePassword}
                    className="px-4 py-2.5 rounded-xl bg-[#1c2234] hover:bg-[#252c42] text-white text-xs md:text-sm font-semibold border border-[#2e374e] flex items-center gap-2 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>{isBn ? 'অ্যাডমিন পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
                  </button>
                </div>
              </div>

              {/* Recent Videos Overview */}
              <div className="bg-[#141926] border border-[#252d40] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    {isBn ? 'সর্বশেষ আপলোডকৃত ভিডিও' : 'Recent Videos'}
                  </h3>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className="text-xs text-[#ff3155] hover:underline font-semibold"
                  >
                    {isBn ? 'সবগুলো দেখুন →' : 'View all videos →'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {videos.slice(0, 3).map((v) => (
                    <div
                      key={v.id}
                      className="p-3 bg-[#111420] border border-[#22293c] rounded-xl flex gap-3 items-center"
                    >
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        className="w-20 aspect-video object-cover rounded-lg bg-[#181d2c]"
                      />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h4 className="text-xs font-bold text-white truncate">{v.title}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#7e8aa0]">
                          <span>{v.category}</span>
                          <span>·</span>
                          <span
                            className={
                              v.published !== false
                                ? 'text-emerald-400 font-semibold'
                                : 'text-amber-400 font-semibold'
                            }
                          >
                            {v.published !== false ? (isBn ? 'প্রকাশিত' : 'Published') : (isBn ? 'ড্রাফট' : 'Draft')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: VIDEO MANAGEMENT ===================== */}
          {activeTab === 'videos' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#21283c]">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isBn ? 'ভিডিও ব্যবস্থাপনা (Video Management)' : 'Video Management'}
                  </h3>
                  <p className="text-xs text-[#8d98ad]">
                    {isBn
                      ? 'ফোন বা কম্পিউটার থেকে ভিডিও ও থাম্বনেইল আপলোড করুন, সম্পাদনা বা মুছুন।'
                      : 'Upload videos & thumbnails from your phone or PC, edit details, and publish/unpublish.'}
                  </p>
                </div>

                <button
                  onClick={handleOpenAddVideo}
                  className="px-4 py-2.5 rounded-xl bg-[#ff3155] hover:bg-[#e62245] text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#ff3155]/20 transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isBn ? 'নতুন ভিডিও আপলোড করুন' : 'Upload New Video'}</span>
                </button>
              </div>

              {/* Videos Table */}
              <div className="grid grid-cols-1 gap-3">
                {videos.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 bg-[#141926] border border-[#232a3d] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#ff3155]/50 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="relative w-28 md:w-32 aspect-video rounded-xl overflow-hidden bg-[#181d2d] shrink-0 border border-[#252e42]">
                        <img
                          src={v.thumbnail}
                          alt={v.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                          {v.duration}
                        </span>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              v.published !== false
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {v.published !== false
                              ? isBn ? 'প্রকাশিত (Published)' : 'Published'
                              : isBn ? 'ড্রাফট (Unpublished)' : 'Unpublished (Draft)'}
                          </span>

                          <span className="px-2 py-0.5 rounded bg-[#1e2538] text-[11px] text-[#c4c9d5] font-medium">
                            {v.category}
                          </span>

                          {v.isLive && (
                            <span className="px-2 py-0.5 rounded bg-[#ff3155] text-white text-[10px] font-bold">
                              LIVE
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white truncate">{v.title}</h4>
                        <p className="text-xs text-[#7e8aa0] truncate max-w-xl">
                          {v.description || (isBn ? 'কোনো বিবরণ যোগ করা হয়নি।' : 'No description.')}
                        </p>

                        {/* Tags */}
                        {Array.isArray(v.tags) && v.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {v.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.2 rounded bg-[#101420] text-[10px] text-[#93a0b8]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Toggle Publish, Edit, Delete */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => handleTogglePublish(v.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          v.published !== false
                            ? 'bg-[#1b2538] hover:bg-[#232f46] text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#28221b] hover:bg-[#382e22] text-amber-400 border border-amber-500/30'
                        }`}
                        title={v.published !== false ? 'Unpublish' : 'Publish'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>
                          {v.published !== false
                            ? isBn ? 'আনপাবলিশ' : 'Unpublish'
                            : isBn ? 'পাবলিশ করুন' : 'Publish'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleOpenEditVideo(v)}
                        className="p-2 rounded-lg bg-[#1f2638] hover:bg-[#2b354d] text-[#c4c9d5] hover:text-white transition-colors"
                        title="Edit Video"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteVideo(v.id, v.title)}
                        className="p-2 rounded-lg bg-[#2a1720] hover:bg-[#ff3155] text-[#ff6882] hover:text-white transition-colors"
                        title="Delete Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== TAB 3: CATEGORY MANAGEMENT ===================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-[#21283c]">
                <h3 className="text-base font-bold text-white">
                  {isBn ? 'ক্যাটাগরি ব্যবস্থাপনা (Category Management)' : 'Category Management'}
                </h3>
                <p className="text-xs text-[#8d98ad]">
                  {isBn
                    ? 'নতুন ক্যাটাগরি তৈরি করুন, নাম পরিবর্তন করুন অথবা ক্যাটাগরি ডিলিট করুন।'
                    : 'Create, edit, or delete video categories. Videos will automatically re-index.'}
                </p>
              </div>

              {/* Add New Category Form */}
              <form
                onSubmit={handleAddCategory}
                className="p-4 bg-[#141926] border border-[#232a3d] rounded-2xl flex flex-col sm:flex-row gap-3 items-end"
              >
                <div className="flex-1 w-full space-y-1">
                  <label className="text-xs font-semibold text-[#c4c9d5]">
                    {isBn ? 'ক্যাটাগরির নাম (বাংলা) *' : 'Category Name (Bangla) *'}
                  </label>
                  <input
                    type="text"
                    value={newCatLabelBn}
                    onChange={(e) => setNewCatLabelBn(e.target.value)}
                    placeholder="যেমন: কমেডি নাটক, পডকাস্ট..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#192030] border border-[#2b354c] text-white text-xs md:text-sm focus:outline-none focus:border-[#ff3155]"
                  />
                </div>

                <div className="flex-1 w-full space-y-1">
                  <label className="text-xs font-semibold text-[#c4c9d5]">
                    {isBn ? 'ক্যাটাগরির নাম (English)' : 'Category Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={newCatLabelEn}
                    onChange={(e) => setNewCatLabelEn(e.target.value)}
                    placeholder="e.g. Comedy, Podcast..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#192030] border border-[#2b354c] text-white text-xs md:text-sm focus:outline-none focus:border-[#ff3155]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newCatLabelBn.trim() && !newCatLabelEn.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#ff3155] hover:bg-[#e62245] text-white text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#ff3155]/20 disabled:opacity-40 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isBn ? 'ক্যাটাগরি যোগ করুন' : 'Add Category'}</span>
                </button>
              </form>

              {/* Existing Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-[#141926] border border-[#232a3d] rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FolderPlus className="w-4 h-4 text-[#ff3155]" />
                        <h4 className="text-sm font-bold text-white truncate">{c.labelBn}</h4>
                      </div>
                      <p className="text-xs text-[#8e98ac]">
                        {c.labelEn} •{' '}
                        <span className="text-emerald-400 font-semibold">
                          {c.videoCount ?? 0} {isBn ? 'টি ভিডিও' : 'videos'}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteCategory(c.id, c.labelBn)}
                      className="p-2 rounded-lg bg-[#2a1720] hover:bg-[#ff3155] text-[#ff6882] hover:text-white transition-colors shrink-0"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== TAB 4: TAG MANAGEMENT ===================== */}
          {activeTab === 'tags' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-[#21283c]">
                <h3 className="text-base font-bold text-white">
                  {isBn ? 'ট্যাগ ব্যবস্থাপনা (Tag Management)' : 'Tag Management'}
                </h3>
                <p className="text-xs text-[#8d98ad]">
                  {isBn
                    ? 'ভিডিওগুলোর সার্চ ট্যাগ সম্পাদনা বা মুছে ফেলুন। ট্যাগগুলো দর্শকদের দ্রুত ভিডিও খুঁজে পেতে সাহায্য করে।'
                    : 'Manage tags across videos to optimize user search and discovery.'}
                </p>
              </div>

              {tags.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8e98ac] bg-[#141926] rounded-2xl border border-dashed border-[#232a3d]">
                  {isBn ? 'কোনো ট্যাগ পাওয়া যায়নি।' : 'No tags found.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tags.map((t) => (
                    <div
                      key={t.tag}
                      className="p-3.5 bg-[#141926] border border-[#232a3d] rounded-2xl flex items-center justify-between gap-3"
                    >
                      {editingTag === t.tag ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={newTagValue}
                            onChange={(e) => setNewTagValue(e.target.value)}
                            className="flex-1 px-2.5 py-1 bg-[#1a2133] border border-[#2d3850] rounded-lg text-xs text-white"
                          />
                          <button
                            onClick={() => handleRenameTag(t.tag)}
                            className="p-1 rounded bg-emerald-500 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingTag(null)}
                            className="p-1 rounded bg-[#252e42] text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <TagIcon className="w-3.5 h-3.5 text-[#ff3155] shrink-0" />
                            <span className="text-xs font-bold text-white truncate">#{t.tag}</span>
                            <span className="px-1.5 py-0.2 rounded-full bg-[#1b2234] text-[10px] text-[#8e99ae] font-semibold">
                              {t.count}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditingTag(t.tag);
                                setNewTagValue(t.tag);
                              }}
                              className="p-1.5 rounded-lg bg-[#1e2538] hover:bg-[#28324a] text-[#c4c9d5] transition-colors"
                              title="Rename Tag"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTag(t.tag)}
                              className="p-1.5 rounded-lg bg-[#291720] hover:bg-[#ff3155] text-[#ff6882] hover:text-white transition-colors"
                              title="Delete Tag"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 5: ADVERTISEMENT MANAGEMENT ===================== */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-[#21283c]">
                <h3 className="text-base font-bold text-white">
                  {isBn ? 'বিজ্ঞাপন ব্যবস্থাপনা (Advertisement Management)' : 'Advertisement Management'}
                </h3>
                <p className="text-xs text-[#8d98ad]">
                  {isBn
                    ? 'Header, Homepage, Between Videos, Sidebar, ও Footer পজিশনের বিজ্ঞাপন কোড যুক্ত বা নিয়ন্ত্রণ করুন।'
                    : 'Manage responsive HTML/JavaScript ad scripts across Header, Homepage, Between Videos, Sidebar, & Footer.'}
                </p>
              </div>

              {/* Add / Edit Ad Form */}
              <form
                onSubmit={handleSaveAd}
                className="p-5 bg-[#141926] border border-[#232a3d] rounded-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#202638]">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {adEditingId
                      ? isBn ? 'বিজ্ঞাপন সম্পাদনা ফরম' : 'Edit Ad Placement'
                      : isBn ? 'নতুন বিজ্ঞাপন যুক্ত করার ফরম' : 'Add New Ad Placement'}
                  </h4>

                  {adEditingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdEditingId(null);
                        setAdNetworkName('');
                        setAdPlacementName('');
                        setAdCode('');
                        setAdPosition('Header');
                      }}
                      className="text-xs text-[#a5adbd] hover:text-white underline"
                    >
                      {isBn ? 'সম্পাদনা বাতিল' : 'Cancel Edit'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#c4c9d5] mb-1">
                      {isBn ? 'বিজ্ঞাপন নেটওয়ার্ক নাম (Ad Network Name) *' : 'Ad Network Name *'}
                    </label>
                    <input
                      type="text"
                      value={adNetworkName}
                      onChange={(e) => setAdNetworkName(e.target.value)}
                      placeholder="Google AdSense, Media.net, Adsterra..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#192030] border border-[#2b354c] text-white focus:outline-none focus:border-[#ff3155]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#c4c9d5] mb-1">
                      {isBn ? 'প্লেসমেন্ট নাম (Placement Name) *' : 'Placement Name *'}
                    </label>
                    <input
                      type="text"
                      value={adPlacementName}
                      onChange={(e) => setAdPlacementName(e.target.value)}
                      placeholder="Header Leaderboard, Between Videos Stream Banner..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#192030] border border-[#2b354c] text-white focus:outline-none focus:border-[#ff3155]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#c4c9d5] mb-1">
                      {isBn ? 'বিজ্ঞাপন অবস্থান (Ad Position) *' : 'Ad Position *'}
                    </label>
                    <select
                      value={adPosition}
                      onChange={(e) => setAdPosition(e.target.value as AdPosition)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#192030] border border-[#2b354c] text-white focus:outline-none focus:border-[#ff3155]"
                    >
                      <option value="Header">Header (হেডার শীর্ষ ব্যানার)</option>
                      <option value="Homepage">Homepage (হোমপেজ মিড-ব্যানার)</option>
                      <option value="Between Videos">Between Videos (ভিডিও গ্রিডের ভেতরে)</option>
                      <option value="Sidebar">Sidebar (প্লেয়ার সাইডবার)</option>
                      <option value="Footer">Footer (ফুটার ব্যানার)</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="block font-semibold text-[#c4c9d5] mb-1">
                      {isBn ? 'বিজ্ঞাপন স্ট্যাটাস' : 'Ad Status'}
                    </label>
                    <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#192030] border border-[#2b354c]">
                      <input
                        type="checkbox"
                        checked={adEnabled}
                        onChange={(e) => setAdEnabled(e.target.checked)}
                        className="w-4 h-4 accent-[#ff3155]"
                      />
                      <span className={`text-xs font-bold ${adEnabled ? 'text-emerald-400' : 'text-[#8793aa]'}`}>
                        {adEnabled
                          ? isBn ? 'সক্রিয় (Enabled)' : 'Enabled'
                          : isBn ? 'নিষ্ক্রিয় (Disabled)' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#c4c9d5]">
                      {isBn ? 'বিজ্ঞাপন HTML / JavaScript কোড *' : 'Ad HTML / JavaScript Code *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setAdShowPreview(!adShowPreview)}
                      className="text-[#ff3155] hover:underline"
                    >
                      {adShowPreview ? (isBn ? 'প্রিভিউ বন্ধ' : 'Hide Preview') : (isBn ? 'লাইভ প্রিভিউ দেখুন' : 'Live Preview')}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={adCode}
                    onChange={(e) => setAdCode(e.target.value)}
                    placeholder="<script async src='...'></script>\n<!-- অথবা কাস্টম ব্যানার HTML -->"
                    className="w-full px-3.5 py-2 font-mono text-xs rounded-xl bg-[#111420] border border-[#293246] text-white focus:outline-none focus:border-[#ff3155]"
                  />
                </div>

                {adShowPreview && adCode && (
                  <div className="p-3 bg-[#101420] rounded-xl border border-[#252c3e]">
                    <SandboxedAd
                      ad={{
                        id: 'preview',
                        networkName: adNetworkName || 'Network',
                        placementName: adPlacementName || 'Placement',
                        code: adCode,
                        position: adPosition,
                        enabled: true,
                        createdAt: '',
                        updatedAt: '',
                      }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#ff3155] hover:bg-[#e62245] text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#ff3155]/20 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{isBn ? 'বিজ্ঞাপন সংরক্ষণ করুন' : 'Save Advertisement'}</span>
                </button>
              </form>

              {/* Existing Ads List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isBn ? 'বিদ্যমান বিজ্ঞাপনের তালিকা' : 'Active Advertisements'}
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {ads.map((ad) => (
                    <div
                      key={ad.id}
                      className="p-4 bg-[#141926] border border-[#232a3d] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{ad.placementName}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#21293c] text-[#ff3155]">
                            {ad.networkName}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#1e2538] text-[#c4c9d5]">
                            {ad.position}
                          </span>
                        </div>
                        <p className="text-xs text-[#8793aa] font-mono truncate max-w-xl">
                          {ad.code.substring(0, 70)}...
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleAd(ad.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            ad.enabled
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-[#21293d] text-[#8793a9] border border-[#2b354d]'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{ad.enabled ? (isBn ? 'সক্রিয়' : 'Enabled') : (isBn ? 'নিষ্ক্রিয়' : 'Disabled')}</span>
                        </button>

                        <button
                          onClick={() => handleEditAd(ad)}
                          className="p-2 rounded-lg bg-[#1f2638] hover:bg-[#2b354d] text-[#c4c9d5] hover:text-white transition-colors"
                          title="Edit Ad"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteAd(ad.id, ad.placementName)}
                          className="p-2 rounded-lg bg-[#2a1720] hover:bg-[#ff3155] text-[#ff6882] hover:text-white transition-colors"
                          title="Delete Ad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 6: SECURITY & DATABASE ===================== */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-4xl">
              <div className="pb-2 border-b border-[#21283c]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>{isBn ? 'ডাটাবেস ও নিরাপত্তা আর্কিটেকচার' : 'Backend & Database Architecture'}</span>
                </h3>
                <p className="text-xs text-[#8d98ad]">
                  {isBn
                    ? 'এডমিন পাসওয়ার্ড ক্রিপ্টোগ্রাফিক হ্যাশ ও ব্যাকএন্ড ফাইল পারসিস্টেন্সের বিবরণ।'
                    : 'Backend configuration details, security policies, and permanent cloud database setup.'}
                </p>
              </div>

              {/* Status cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#141926] border border-[#232a3d] rounded-2xl space-y-2">
                  <span className="text-[#8e98ac] font-bold uppercase tracking-wider">
                    {isBn ? 'পাসওয়ার্ড সিকিউরিটি' : 'Password Security'}
                  </span>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>PBKDF2-SHA512 Salted Hashing</span>
                  </div>
                  <p className="text-[#a5adbd] leading-relaxed">
                    {isBn
                      ? 'পাসওয়ার্ড কখনোই প্লেইনটেক্সট হিসেবে সংরক্ষিত হয় না। ১০০,০০০ ইটারেশন এবং ১২৮-বিট র্যান্ডম সল্টের মাধ্যমে হ্যাশ করা হয়।'
                      : 'Passwords are never stored in plaintext. Cryptographically protected with 100k iterations and random salts.'}
                  </p>
                </div>

                <div className="p-4 bg-[#141926] border border-[#232a3d] rounded-2xl space-y-2">
                  <span className="text-[#8e98ac] font-bold uppercase tracking-wider">
                    {isBn ? 'স্টোরেজ ড্রাইভ' : 'Storage Engine'}
                  </span>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Node.js Server Database (/data/*.json)</span>
                  </div>
                  <p className="text-[#a5adbd] leading-relaxed">
                    {isBn
                      ? 'ভিডিও, থাম্বনেইল ফাইল, ক্যাটাগরি এবং বিজ্ঞাপন সেটিংস স্থায়ীভাবে সার্ভার স্টোরেজে সংরক্ষিত।'
                      : 'All media uploads, categories, tags, and settings are saved on the server filesystem.'}
                  </p>
                </div>
              </div>

              {/* Cloud Run / Deployment Info (Requirement 7) */}
              <div className="p-5 bg-[#121624] border border-[#252d42] rounded-2xl space-y-3 text-xs">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#ff3155]" />
                  <span>{isBn ? 'ক্লাউড ক্লাস্টার ও পার্মানেন্ট ডাটাবেস গাইডলাইন' : 'Cloud Setup & Deployment Instructions'}</span>
                </h4>
                <p className="text-[#c4c9d5] leading-relaxed">
                  {isBn
                    ? 'বর্তমানে আপনার ওয়েবসাইটের সমস্ত আপলোড এবং ডাটা Node.js ব্যাকএন্ডের মাধ্যমে নিখুঁতভাবে পরিচালিত হচ্ছে। মাল্টি-ইনস্ট্যান্স ক্লাউড কনটেইনারের ক্ষেত্রে ক্লাউড এসকিউএল (PostgreSQL) বা ফায়ারবেস ফায়ারস্টোর সংযুক্ত করা যেতে পারে।'
                    : 'The current application is a complete full-stack Node.js + Vite deployment. For multi-container stateless cloud scaling, connect Cloud SQL via DATABASE_URL or Firebase Firestore.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================== VIDEO UPLOAD & EDIT MODAL ===================== */}
      {videoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-form-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
        >
          <div className="relative w-full max-w-2xl bg-[#131724] border border-[#273046] rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#21283c]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ff3155]/20 flex items-center justify-center text-[#ff3155]">
                  <Film className="w-4 h-4" />
                </div>
                <h3 id="video-form-title" className="text-base font-bold text-white">
                  {editingVideoId
                    ? isBn ? 'ভিডিও বিবরণ সম্পাদনা করুন' : 'Edit Video Details'
                    : isBn ? 'নতুন ভিডিও আপলোড করুন (Phone or PC)' : 'Upload Video (Phone or PC)'}
                </h3>
              </div>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8e98ac] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-[#ff3155]/15 border border-[#ff3155]/30 text-xs text-[#ff6882]">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleSaveVideo} className="space-y-4 text-xs md:text-sm">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#c4c9d5] mb-1">
                  {isBn ? 'ভিডিও শিরোনাম (Title) *' : 'Video Title *'}
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder={isBn ? 'যেমন: নতুন বিশেষ বাংলা নাটক ২০২৬...' : 'e.g. New Special Bengali Drama 2026...'}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2133] border border-[#2b354c] text-white focus:outline-none focus:border-[#ff3155]"
                />
              </div>

              {/* Video File Upload (Phone/PC) OR URL Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#c4c9d5]">
                  {isBn ? 'ভিডিও ফাইল আপলোড অথবা URL লিংক *' : 'Video File Upload or URL *'}
                </label>

                {/* Upload Button for Phone & PC */}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={videoFileInputRef}
                    onChange={handleVideoFileUpload}
                    accept="video/mp4,video/webm,video/ogg,video/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#1f2638] hover:bg-[#28324a] text-white text-xs font-semibold border border-[#2b354c] flex items-center gap-2 transition-colors shrink-0"
                  >
                    <UploadCloud className="w-4 h-4 text-[#ff3155]" />
                    <span>{isBn ? 'ডিভাইস থেকে ফাইল নির্বাচন করুন' : 'Choose File from Device'}</span>
                  </button>

                  <span className="text-xs text-[#7d879c] truncate">
                    {videoUrl ? (
                      <span className="text-emerald-400 font-mono">
                        ✓ {videoUrl.substring(0, 35)}...
                      </span>
                    ) : (
                      isBn ? 'MP4 / WebM ফাইল নির্বাচন করুন' : 'Select MP4 / WebM'
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                {videoUploadProgress !== null && (
                  <div className="w-full bg-[#1b2234] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#ff3155] h-full transition-all duration-300"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                )}

                {/* Direct URL input fallback */}
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="বা সরাসরি ভিডিও URL (MP4 বা YouTube) পেস্ট করুন..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1a2133] border border-[#2b354c] text-white text-xs focus:outline-none focus:border-[#ff3155]"
                />
              </div>

              {/* Thumbnail Upload (Phone/PC) OR URL */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#c4c9d5]">
                  {isBn ? 'থাম্বনেইল ইমেজ (Thumbnail Image)' : 'Thumbnail Image'}
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={thumbFileInputRef}
                    onChange={handleThumbFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => thumbFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-[#1f2638] hover:bg-[#28324a] text-white text-xs font-semibold border border-[#2b354c] flex items-center gap-2 transition-colors shrink-0"
                  >
                    <ImageIcon className="w-4 h-4 text-[#ff3155]" />
                    <span>{isBn ? 'থাম্বনেইল ছবি আপলোড' : 'Upload Thumbnail Image'}</span>
                  </button>

                  {videoThumbnail && (
                    <img
                      src={videoThumbnail}
                      alt="Thumbnail preview"
                      className="w-14 h-9 object-cover rounded-lg border border-[#2b354c]"
                    />
                  )}
                </div>

                {thumbUploadProgress !== null && (
                  <div className="w-full bg-[#1b2234] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${thumbUploadProgress}%` }}
                    />
                  </div>
                )}

                <input
                  type="text"
                  value={videoThumbnail}
                  onChange={(e) => setVideoThumbnail(e.target.value)}
                  placeholder="বা থাম্বনেইল ছবির URL লিংক পেস্ট করুন..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1a2133] border border-[#2b354c] text-white text-xs focus:outline-none focus:border-[#ff3155]"
                />
              </div>

              {/* Category & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#c4c9d5] mb-1">
                    {isBn ? 'ক্যাটাগরি (Category) *' : 'Category *'}
                  </label>
                  <select
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1a2133] border border-[#2b354c] text-white text-xs focus:outline-none focus:border-[#ff3155]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isBn ? c.labelBn : c.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#c4c9d5] mb-1">
                    {isBn ? 'ভিডিও দৈর্ঘ্য (Duration)' : 'Duration'}
                  </label>
                  <input
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="যেমন: ১২:৩০"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1a2133] border border-[#2b354c] text-white text-xs focus:outline-none focus:border-[#ff3155]"
                  />
                </div>
              </div>

              {/* Channel & Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#c4c9d5] mb-1">
                    {isBn ? 'চ্যানেল / ক্রিয়েটরের নাম' : 'Channel Name'}
                  </label>
                  <input
                    type="text"
                    value={videoChannel}
                    onChange={(e) => setVideoChannel(e.target.value)}
                    placeholder="Live Video Official"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1a2133] border border-[#2b354c] text-white text-xs focus:outline-none focus:border-[#ff3155]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#c4c9d5] mb-1">
                    {isBn ? 'ট্যাগস (কমা দিয়ে আলাদা করুন)' : 'Tags (comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={videoTagsInput}
                    onChange={(e) => setVideoTagsInput(e.target.value)}
                    placeholder="Natok, Romantic, Dhaka"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1a2133] border border-[#2b354c] text-white text-xs focus:outline-none focus:border-[#ff3155]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#c4c9d5] mb-1">
                  {isBn ? 'ভিডিও বিবরণী (Description)' : 'Video Description'}
                </label>
                <textarea
                  rows={3}
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder={isBn ? 'ভিডিও সম্পর্কে বিস্তারিত তথ্য...' : 'Write video description...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1a2133] border border-[#2b354c] text-white text-xs focus:outline-none focus:border-[#ff3155]"
                />
              </div>

              {/* Publish State & Live State Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={videoPublished}
                    onChange={(e) => setVideoPublished(e.target.checked)}
                    className="w-4 h-4 accent-[#ff3155]"
                  />
                  <span className="font-semibold text-white">
                    {isBn ? 'তাত্ক্ষণিকভাবে হোমপেজে প্রকাশ করুন (Publish to Homepage)' : 'Publish to Homepage'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={videoIsLive}
                    onChange={(e) => setVideoIsLive(e.target.checked)}
                    className="w-4 h-4 accent-[#ff3155]"
                  />
                  <span className="font-semibold text-white">
                    {isBn ? 'লাইভ স্ট্রিম হিসেবে চিহ্নিত করুন' : 'Mark as Live Stream'}
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#21283c]">
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1a2133] text-xs font-semibold text-[#8e98ac] hover:text-white"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={videoSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#ff3155] hover:bg-[#e62245] text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#ff3155]/20 disabled:opacity-50"
                >
                  {videoSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>
                    {editingVideoId
                      ? isBn ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'
                      : isBn ? 'ভিডিও আপলোড ও প্রকাশ করুন' : 'Upload & Publish Video'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
