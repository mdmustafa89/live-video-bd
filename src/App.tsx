import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { VideoCard } from './components/VideoCard';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { AddVideoModal } from './components/AddVideoModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SandboxedAd } from './components/SandboxedAd';
import { Footer } from './components/Footer';
import { INITIAL_VIDEOS } from './data/initialVideos';
import { VideoItem, Language } from './types/video';
import { Advertisement } from './types/ad';
import { AdService } from './services/adService';
import { AuthService, AuthState } from './services/authService';
import { VideoService } from './services/videoService';
import { Search, CheckCircle, ShieldAlert, KeyRound } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Authentication State (Requirement 1, 4, 8)
  const [authStatus, setAuthStatus] = useState<AuthState>(() => AuthService.init());

  // Advertisements state
  const [ads, setAds] = useState<Advertisement[]>([]);

  // Videos state from backend API (Requirement 10 & 11)
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('live_video_favs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal states
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminModalTab, setAdminModalTab] = useState<
    'overview' | 'videos' | 'categories' | 'tags' | 'ads' | 'security'
  >('overview');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check auth status on mount
  useEffect(() => {
    AuthService.checkStatus().then((status) => {
      setAuthStatus(status);
      if (status.isAuthenticated && status.mustChangePassword) {
        setIsChangePasswordModalOpen(true);
      }
    });

    // Check for /admin URL path or query
    if (window.location.pathname === '/admin' || window.location.search.includes('admin=true')) {
      const current = AuthService.init();
      if (current.isAuthenticated) {
        setIsAdminModalOpen(true);
      } else {
        setIsLoginModalOpen(true);
      }
    }
  }, []);

  // Fetch videos from backend
  const fetchVideos = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const list = await VideoService.getVideos();
      setVideos(list);
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  // Fetch advertisements
  const fetchAds = useCallback(async () => {
    try {
      const activeAds = await AdService.getPublicAds();
      setAds(activeAds);
    } catch (err) {
      console.error('Error fetching ads:', err);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
    fetchAds();
  }, [fetchVideos, fetchAds]);

  // Sync favorites to localStorage
  useEffect(() => {
    localStorage.setItem('live_video_favs', JSON.stringify(favorites));
  }, [favorites]);

  // Handle URL query param on mount e.g. ?v=id
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const videoParam = params.get('v');
    if (videoParam && videos.length > 0) {
      const found = videos.find((v) => v.id === videoParam);
      if (found) {
        setActiveVideo(found);
      }
    }
  }, [videos]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        showToast(lang === 'bn' ? 'পছন্দের তালিকা থেকে সরানো হয়েছে' : 'Removed from favorites');
        return prev.filter((item) => item !== id);
      } else {
        showToast(lang === 'bn' ? 'পছন্দের তালিকায় যুক্ত হয়েছে' : 'Added to favorites');
        return [...prev, id];
      }
    });
  };

  // Video Management (Requirement 10: Admin only upload, edit, delete)
  const handleSaveVideo = async (videoData: Partial<VideoItem>, id?: string): Promise<boolean> => {
    if (id) {
      const res = await VideoService.updateVideo(id, videoData);
      if (res.success) {
        showToast(lang === 'bn' ? 'ভিডিও সফলভাবে আপডেট করা হয়েছে!' : 'Video updated successfully!');
        await fetchVideos();
        setEditingVideo(null);
        return true;
      }
      showToast(res.error || 'Failed to update video');
      return false;
    } else {
      const res = await VideoService.addVideo(videoData);
      if (res.success) {
        showToast(lang === 'bn' ? 'নতুন ভিডিও সফলভাবে আপলোড করা হয়েছে!' : 'New video published successfully!');
        await fetchVideos();
        if (res.data) setActiveVideo(res.data);
        return true;
      }
      showToast(res.error || 'Failed to add video');
      return false;
    }
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    if (!authStatus.isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    const confirmMsg =
      lang === 'bn'
        ? `আপনি কি নিশ্চিতভাবে "${title}" ভিডিওটি মুছে ফেলতে চান?`
        : `Are you sure you want to delete "${title}"?`;

    if (window.confirm(confirmMsg)) {
      const res = await VideoService.deleteVideo(id);
      if (res.success) {
        showToast(lang === 'bn' ? 'ভিডিও মুছে ফেলা হয়েছে।' : 'Video deleted.');
        await fetchVideos();
      } else {
        showToast(res.error || 'Failed to delete video');
      }
    }
  };

  const handleEditVideo = (video: VideoItem) => {
    if (!authStatus.isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    setEditingVideo(video);
    setIsAddModalOpen(true);
  };

  const handleAddVideoClick = () => {
    if (!authStatus.isAuthenticated) {
      showToast(
        lang === 'bn'
          ? 'ভিডিও আপলোড করতে অ্যাডমিন হিসেবে লগইন করুন।'
          : 'Please sign in as administrator to upload videos.'
      );
      setIsLoginModalOpen(true);
      return;
    }
    setEditingVideo(null);
    setIsAddModalOpen(true);
  };

  // Login & Logout Handlers
  const handleLoginSuccess = (mustChange: boolean) => {
    const updated = AuthService.init();
    setAuthStatus(updated);
    if (mustChange) {
      setIsChangePasswordModalOpen(true);
    } else {
      showToast(lang === 'bn' ? 'অ্যাডমিন হিসেবে লগইন সম্পন্ন হয়েছে!' : 'Logged in as Administrator!');
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setAuthStatus({ isAuthenticated: false, mustChangePassword: false, username: null });
    showToast(lang === 'bn' ? 'সফলভাবে লগআউট হয়েছে।' : 'Logged out successfully.');
  };

  // Filtered videos
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      if (showFavoritesOnly && !favorites.includes(video.id)) {
        return false;
      }

      if (selectedCategory !== 'all') {
        if (selectedCategory === 'লাইভ স্ট্রিম') {
          if (!video.isLive) return false;
        } else if (video.category !== selectedCategory) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = video.title.toLowerCase().includes(q);
        const titleEnMatch = video.titleEn ? video.titleEn.toLowerCase().includes(q) : false;
        const channelMatch = video.channelName.toLowerCase().includes(q);
        const categoryMatch = video.category.toLowerCase().includes(q);
        const tagMatch = video.tags ? video.tags.some((t) => t.toLowerCase().includes(q)) : false;

        return titleMatch || titleEnMatch || channelMatch || categoryMatch || tagMatch;
      }

      return true;
    });
  }, [videos, favorites, showFavoritesOnly, selectedCategory, searchQuery]);

  // Position-based Ad partitioning
  const headerAds = useMemo(() => ads.filter((a) => a.position === 'Header' && a.enabled), [ads]);
  const homepageAds = useMemo(() => ads.filter((a) => a.position === 'Homepage' && a.enabled), [ads]);
  const betweenVideoAds = useMemo(() => ads.filter((a) => a.position === 'Between Videos' && a.enabled), [ads]);
  const sidebarAds = useMemo(() => ads.filter((a) => a.position === 'Sidebar' && a.enabled), [ads]);
  const footerAds = useMemo(() => ads.filter((a) => a.position === 'Footer' && a.enabled), [ads]);

  const featuredVideo = videos[0] || INITIAL_VIDEOS[0];
  const isBn = lang === 'bn';

  return (
    <div className="min-h-screen bg-[#090b12] text-white flex flex-col font-['Hind_Siliguri','Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#151925] border border-[#ff3155] text-white text-xs md:text-sm font-semibold rounded-xl shadow-2xl animate-bounce">
          <CheckCircle className="w-4 h-4 text-[#ff3155]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mandatory Password Change Banner (Requirement 4) */}
      {authStatus.isAuthenticated && authStatus.mustChangePassword && (
        <div className="bg-[#ff3155]/20 border-b border-[#ff3155]/40 px-4 py-2 text-xs md:text-sm text-center flex items-center justify-center gap-3">
          <ShieldAlert className="w-4 h-4 text-[#ff3155]" />
          <span className="font-semibold text-white">
            {isBn
              ? 'নিরাপত্তা সতর্কতা: ড্যাশবোর্ডে পূর্ণ অ্যাক্সেস পেতে আপনার প্রাথমিক পাসওয়ার্ড (Ssmmaa1) পরিবর্তন করুন।'
              : 'Security requirement: Change your initial password (Ssmmaa1) before accessing admin controls.'}
          </span>
          <button
            onClick={() => setIsChangePasswordModalOpen(true)}
            className="px-3 py-1 rounded bg-[#ff3155] hover:bg-[#e62245] text-white text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isBn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        lang={lang}
        setLang={setLang}
        onOpenAddModal={handleAddVideoClick}
        onOpenAdminModal={(tab) => {
          if (tab) setAdminModalTab(tab);
          setIsAdminModalOpen(true);
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenChangePasswordModal={() => setIsChangePasswordModalOpen(true)}
        onLogout={handleLogout}
        isAdmin={authStatus.isAuthenticated}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        favoritesCount={favorites.length}
      />

      {/* HEADER POSITION ADVERTISEMENT */}
      {headerAds.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-3">
          {headerAds.map((ad) => (
            <SandboxedAd key={ad.id} ad={ad} showLabel={true} />
          ))}
        </div>
      )}

      <main className="flex-1">
        {/* Hero Section */}
        {!searchQuery && !showFavoritesOnly && (
          <Hero
            featuredVideo={featuredVideo}
            onPlayVideo={(v) => setActiveVideo(v)}
            lang={lang}
          />
        )}

        {/* HOMEPAGE POSITION ADVERTISEMENT */}
        {homepageAds.length > 0 && !searchQuery && !showFavoritesOnly && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 my-4">
            {homepageAds.map((ad) => (
              <SandboxedAd key={ad.id} ad={ad} showLabel={true} />
            ))}
          </div>
        )}

        {/* Video Grid Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-6">
          {/* Section Header & Category Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#252938] pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                <span>
                  {showFavoritesOnly
                    ? isBn ? '❤️ আপনার পছন্দের ভিডিও' : '❤️ Saved Videos'
                    : isBn ? '🎬 সর্বশেষ ভিডিও' : '🎬 Latest Videos'}
                </span>
              </h2>
              <span className="text-xs text-[#a5adbd]">
                ({filteredVideos.length} {isBn ? 'টি ভিডিও' : 'videos'})
              </span>
            </div>

            {/* Category Filter bar */}
            {!showFavoritesOnly && (
              <div className="max-w-2xl">
                <CategoryFilter
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  lang={lang}
                />
              </div>
            )}
          </div>

          {/* Active Search / Filter Feedback */}
          {(searchQuery || showFavoritesOnly || selectedCategory !== 'all') && (
            <div className="flex items-center justify-between bg-[#151925] px-4 py-2.5 rounded-xl border border-[#242a39] text-xs text-[#c4c9d5]">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{isBn ? 'ফিল্টার সক্রিয়:' : 'Active Filter:'}</span>
                {searchQuery && (
                  <span className="text-white font-semibold">
                    "{searchQuery}"
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="text-[#ff3155] font-semibold">
                    [{selectedCategory}]
                  </span>
                )}
                {showFavoritesOnly && (
                  <span className="text-[#ff3155] font-semibold">
                    [{isBn ? 'পছন্দের তালিকা' : 'Saved List'}]
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setShowFavoritesOnly(false);
                }}
                className="text-xs text-[#ff3155] hover:underline font-semibold"
              >
                {isBn ? 'ফিল্টার মুছুন' : 'Reset Filters'}
              </button>
            </div>
          )}

          {/* Grid with BETWEEN VIDEOS ADVERTISEMENT INJECTION */}
          {filteredVideos.length > 0 ? (
            <div
              id="videoGrid"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
            >
              {filteredVideos.map((video, idx) => {
                const showBetweenAd = idx === 3 && betweenVideoAds.length > 0;
                const betweenAd = betweenVideoAds[0];

                return (
                  <React.Fragment key={video.id}>
                    <VideoCard
                      video={video}
                      onPlay={(v) => setActiveVideo(v)}
                      isFavorite={favorites.includes(video.id)}
                      onToggleFavorite={handleToggleFavorite}
                      isAdmin={authStatus.isAuthenticated}
                      onEditVideo={handleEditVideo}
                      onDeleteVideo={handleDeleteVideo}
                      lang={lang}
                    />

                    {/* BETWEEN VIDEOS POSITION ADVERTISEMENT */}
                    {showBetweenAd && betweenAd && (
                      <div className="col-span-2 md:col-span-3 lg:col-span-4 my-2">
                        <SandboxedAd ad={betweenAd} showLabel={true} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div
              id="emptyMessage"
              className="text-center py-16 px-4 bg-[#151925]/60 rounded-2xl border border-dashed border-[#2d3345] space-y-3 max-w-md mx-auto my-8"
            >
              <div className="w-12 h-12 rounded-full bg-[#1b2030] flex items-center justify-center mx-auto text-[#a5adbd]">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                {isBn ? 'কোনো ভিডিও পাওয়া যায়নি।' : 'No videos found.'}
              </h3>
              <p className="text-xs text-[#a5adbd]">
                {isBn
                  ? 'আপনার সার্চ বা নির্বাচিত ক্যাটাগরির সাথে মিল রেখে কোনো ভিডিও মেলেনি।'
                  : 'Try adjusting your search query or category filter.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setShowFavoritesOnly(false);
                }}
                className="mt-2 px-4 py-2 bg-[#ff3155] text-white text-xs font-semibold rounded-lg hover:bg-[#e62245] transition-colors"
              >
                {isBn ? 'সব ভিডিও দেখুন' : 'Show All Videos'}
              </button>
            </div>
          )}
        </section>

        {/* FOOTER POSITION ADVERTISEMENT */}
        {footerAds.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
            {footerAds.map((ad) => (
              <SandboxedAd key={ad.id} ad={ad} showLabel={true} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Video Player Modal with SIDEBAR POSITION ADVERTISEMENTS */}
      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          allVideos={videos}
          sidebarAds={sidebarAds}
          onClose={() => setActiveVideo(null)}
          onSelectVideo={(v) => setActiveVideo(v)}
          isFavorite={favorites.includes(activeVideo.id)}
          onToggleFavorite={handleToggleFavorite}
          lang={lang}
        />
      )}

      {/* Add / Edit Video Modal (Admin Protected - Requirement 10) */}
      {isAddModalOpen && (
        <AddVideoModal
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingVideo(null);
          }}
          onSaveVideo={handleSaveVideo}
          editingVideo={editingVideo}
          isAdmin={authStatus.isAuthenticated}
          onRequestLogin={() => setIsLoginModalOpen(true)}
          lang={lang}
        />
      )}

      {/* Premium Admin Dashboard Console (Overview, Videos, Categories, Tags, Ads, Security) */}
      {isAdminModalOpen && (
        <AdminDashboardModal
          onClose={() => setIsAdminModalOpen(false)}
          onRefreshPublicData={() => {
            fetchVideos();
            fetchAds();
          }}
          onRequestChangePassword={() => setIsChangePasswordModalOpen(true)}
          lang={lang}
          initialTab={adminModalTab}
        />
      )}

      {/* Dedicated Admin Login Modal (Requirement 1, 2, 3) */}
      {isLoginModalOpen && (
        <AdminLoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          lang={lang}
        />
      )}

      {/* Mandatory Change Password Modal (Requirement 4, 5, 6) */}
      {isChangePasswordModalOpen && (
        <AdminLoginModal
          onClose={() => setIsChangePasswordModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          forceChangePassword={true}
          lang={lang}
        />
      )}
    </div>
  );
}
