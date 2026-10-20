import React, { useState } from 'react';
import {
  Search,
  PlusCircle,
  Bookmark,
  X,
  Globe,
  Tv,
  Sliders,
  Lock,
  ShieldCheck,
  LogOut,
  KeyRound,
  LayoutDashboard,
  Film,
} from 'lucide-react';
import { Language } from '../types/video';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onOpenAddModal: () => void;
  onOpenAdminModal: (tab?: 'overview' | 'videos' | 'categories' | 'tags' | 'ads' | 'security') => void;
  onOpenLoginModal: () => void;
  onOpenChangePasswordModal: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (fav: boolean) => void;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  lang,
  setLang,
  onOpenAddModal,
  onOpenAdminModal,
  onOpenLoginModal,
  onOpenChangePasswordModal,
  onLogout,
  isAdmin,
  showFavoritesOnly,
  setShowFavoritesOnly,
  favoritesCount,
}) => {
  const isBn = lang === 'bn';
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#10131d]/95 backdrop-blur-md border-b border-[#252938] px-4 md:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setSearchQuery('');
              setShowFavoritesOnly(false);
            }}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            aria-label="Live Video Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff3155] to-[#c71838] flex items-center justify-center text-white shadow-lg shadow-[#ff3155]/20 group-hover:scale-105 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tight text-white select-none">
              LIVE <span className="text-[#ff3155]">VIDEO</span>
            </span>
          </a>
        </div>

        {/* Zone 2: Search Input */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a5adbd]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'ভিডিও খুঁজুন (নাম, বিষয়, বা চ্যানেল)...' : 'Search videos (title, channel, tag)...'}
              aria-label={isBn ? 'ভিডিও খুঁজুন' : 'Search videos'}
              className="w-full pl-10 pr-9 py-2 md:py-2.5 rounded-full bg-[#1b2030] border border-[#303547] text-white placeholder-[#8790a3] text-sm focus:outline-none focus:border-[#ff3155] focus:ring-1 focus:ring-[#ff3155] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a5adbd] hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Zone 3: Actions (Admin / Auth, Favorites, Add Video, Language Toggle) */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Admin Auth Button / Menu */}
          {isAdmin ? (
            <div className="relative">
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs md:text-sm font-bold transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">{isBn ? 'অ্যাডমিন' : 'Admin'}</span>
              </button>

              {showAdminMenu && (
                <div
                  onMouseLeave={() => setShowAdminMenu(false)}
                  className="absolute right-0 mt-2 w-52 bg-[#151926] border border-[#273046] rounded-xl shadow-2xl py-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-1.5 border-b border-[#21293c] text-[11px] text-[#8692a8]">
                    {isBn ? 'অ্যাডমিনিস্ট্রেটর একাউন্ট' : 'Admin Session Active'}
                  </div>

                  <button
                    onClick={() => {
                      setShowAdminMenu(false);
                      onOpenAdminModal('overview');
                    }}
                    className="w-full text-left px-3 py-2 text-[#c4c9d5] hover:text-white hover:bg-[#1e2538] flex items-center gap-2 transition-colors font-medium"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#ff3155]" />
                    <span>{isBn ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAdminMenu(false);
                      onOpenAdminModal('videos');
                    }}
                    className="w-full text-left px-3 py-2 text-[#c4c9d5] hover:text-white hover:bg-[#1e2538] flex items-center gap-2 transition-colors"
                  >
                    <Film className="w-3.5 h-3.5 text-[#ff3155]" />
                    <span>{isBn ? 'ভিডিও ব্যবস্থাপনা' : 'Video Management'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAdminMenu(false);
                      onOpenAdminModal('ads');
                    }}
                    className="w-full text-left px-3 py-2 text-[#c4c9d5] hover:text-white hover:bg-[#1e2538] flex items-center gap-2 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#ff3155]" />
                    <span>{isBn ? 'বিজ্ঞাপন ব্যবস্থাপনা' : 'Manage Ads'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAdminMenu(false);
                      onOpenChangePasswordModal();
                    }}
                    className="w-full text-left px-3 py-2 text-[#c4c9d5] hover:text-white hover:bg-[#1e2538] flex items-center gap-2 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#ff3155]" />
                    <span>{isBn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
                  </button>

                  <div className="border-t border-[#21293c] pt-1">
                    <button
                      onClick={() => {
                        setShowAdminMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-[#ff708a] hover:bg-[#ff3155]/15 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isBn ? 'লগআউট' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#182033] hover:bg-[#202a42] text-[#c4c9d5] hover:text-white border border-[#2b354d] text-xs md:text-sm font-semibold transition-all"
              title={isBn ? 'অ্যাডমিন লগইন' : 'Admin Login'}
            >
              <Lock className="w-3.5 h-3.5 text-[#ff3155]" />
              <span className="hidden sm:inline">
                {isBn ? 'অ্যাডমিন' : 'Admin'}
              </span>
            </button>
          )}

          {/* Favorites Filter Toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
              showFavoritesOnly
                ? 'bg-[#ff3155] text-white shadow-md shadow-[#ff3155]/25'
                : 'bg-[#1b2030] text-[#c4c9d5] border border-[#2d3345] hover:border-[#ff3155]/50 hover:text-white'
            }`}
            title={isBn ? 'পছন্দের ভিডিও তালিকা' : 'Saved Favorites'}
          >
            <Bookmark className={`w-4 h-4 ${showFavoritesOnly ? 'fill-white' : ''}`} />
            <span className="hidden sm:inline">
              {isBn ? 'সংরক্ষিত' : 'Saved'}
            </span>
            {favoritesCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[11px] font-bold rounded-full ${
                showFavoritesOnly ? 'bg-white/20 text-white' : 'bg-[#ff3155] text-white'
              }`}>
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Add Video Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-[#ff3155] hover:bg-[#e62245] text-white rounded-lg text-xs md:text-sm font-semibold transition-all shadow-md shadow-[#ff3155]/20 active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">
              {isBn ? 'ভিডিও যোগ করুন' : 'Add Video'}
            </span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#151925] border border-[#2d3345] text-xs font-semibold text-[#c4c9d5] hover:text-white hover:border-[#454d66] transition-colors whitespace-nowrap"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#ff3155]" />
            <span>{lang.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
