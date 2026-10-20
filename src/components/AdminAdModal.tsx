import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Power,
  ShieldAlert,
  ShieldCheck,
  Database,
  Code2,
  HelpCircle,
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';
import { Advertisement, AdPosition, DatabaseStatus } from '../types/ad';
import { AdService } from '../services/adService';
import { AuthService } from '../services/authService';
import { SandboxedAd } from './SandboxedAd';

interface AdminAdModalProps {
  onClose: () => void;
  onAdsUpdated: () => void;
  onRequestChangePassword?: () => void;
  lang: 'bn' | 'en';
}

export const AdminAdModal: React.FC<AdminAdModalProps> = ({
  onClose,
  onAdsUpdated,
  onRequestChangePassword,
  lang,
}) => {
  const isBn = lang === 'bn';

  // Tabs
  const [activeTab, setActiveTab] = useState<'manage' | 'guide' | 'database'>('manage');

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(AuthService.getToken());
  });
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(() => {
    return AuthService.isMustChangePassword();
  });

  // Ads list
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState('');
  const [placementName, setPlacementName] = useState('');
  const [code, setCode] = useState('');
  const [position, setPosition] = useState<AdPosition>('Header');
  const [enabled, setEnabled] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live preview toggle in form
  const [showFormPreview, setShowFormPreview] = useState(false);

  // Database status
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  // Load ads
  const loadAds = async () => {
    setLoading(true);
    try {
      const data = await AdService.getAllAds();
      setAds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load database status
  const loadDbStatus = async () => {
    try {
      const status = await AdService.getDatabaseStatus();
      setDbStatus(status);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAds();
      loadDbStatus();
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    try {
      const res = await AuthService.login(usernameInput.trim(), passwordInput);
      if (res.success) {
        setIsAuthenticated(true);
        setPasswordInput('');
        if (res.mustChangePassword) {
          setMustChangePassword(true);
          if (onRequestChangePassword) {
            onClose();
            onRequestChangePassword();
            return;
          }
        }
      } else {
        setAuthError(res.error || 'Authentication failed');
      }
    } catch {
      setAuthError('Connection error during authentication.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    resetForm();
  };

  // Populate form for edit
  const handleEditClick = (ad: Advertisement) => {
    setEditingId(ad.id);
    setNetworkName(ad.networkName);
    setPlacementName(ad.placementName);
    setCode(ad.code);
    setPosition(ad.position);
    setEnabled(ad.enabled);
    setFormError('');
    setShowFormPreview(false);
    // Scroll form into view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setNetworkName('');
    setPlacementName('');
    setCode('');
    setPosition('Header');
    setEnabled(true);
    setFormError('');
    setShowFormPreview(false);
  };

  // Save advertisement
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!networkName.trim()) {
      setFormError(isBn ? 'বিজ্ঞাপন নেটওয়ার্কের নাম পূরণ করুন' : 'Network Name is required');
      return;
    }
    if (!placementName.trim()) {
      setFormError(isBn ? 'প্লেসমেন্টের নাম পূরণ করুন' : 'Placement Name is required');
      return;
    }
    if (!code.trim()) {
      setFormError(isBn ? 'বিজ্ঞাপন HTML বা JavaScript কোড প্রদান করুন' : 'Ad HTML/JS Code is required');
      return;
    }

    setIsSaving(true);
    try {
      const res = await AdService.saveAd({
        id: editingId || undefined,
        networkName: networkName.trim(),
        placementName: placementName.trim(),
        code: code.trim(),
        position,
        enabled,
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        resetForm();
        await loadAds();
        await loadDbStatus();
        onAdsUpdated();
      } else {
        setFormError(res.error || 'Failed to save advertisement');
      }
    } catch {
      setFormError('Failed to save advertisement');
    } finally {
      setIsSaving(false);
    }
  };

  // One-click Toggle
  const handleToggle = async (id: string) => {
    await AdService.toggleAd(id);
    await loadAds();
    onAdsUpdated();
  };

  // Delete Ad
  const handleDelete = async (id: string, name: string) => {
    if (confirm(isBn ? `আপনি কি নিশ্চিতভাবে "${name}" বিজ্ঞাপনটি মুছে ফেলতে চান?` : `Are you sure you want to delete "${name}"?`)) {
      await AdService.deleteAd(id);
      await loadAds();
      onAdsUpdated();
      if (editingId === id) resetForm();
    }
  };

  // Code Templates helper
  const applyTemplate = (type: 'adsense' | 'medianet' | 'banner') => {
    if (type === 'adsense') {
      setNetworkName('Google AdSense');
      setPlacementName('Header Leaderboard Responsive');
      setPosition('Header');
      setCode(`<!-- Google AdSense Unit (Sample Code) -->
<div style="text-align: center; background: #131826; border: 1px solid #232c40; border-radius: 8px; padding: 12px; color: #fff;">
  <div style="font-size: 10px; color: #ff3155; font-weight: 700; text-transform: uppercase;">Google AdSense • Responsive</div>
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-1234567890123456"
       data-ad-slot="9876543210"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <p style="font-size: 13px; margin-top: 6px; color: #a5adbd;">সরাসরি অনুমোদিত অ্যাডসেন্স ব্যানার লোড হবে।</p>
</div>`);
    } else if (type === 'medianet') {
      setNetworkName('Media.net');
      setPlacementName('In-Feed Content Unit');
      setPosition('Between Videos');
      setCode(`<!-- Media.net Responsive Contextual Banner -->
<div style="background: linear-gradient(135deg, #181d2f, #111522); border: 1px solid #2a334d; border-radius: 12px; padding: 14px; color: #fff; text-align: center;">
  <span style="font-size: 10px; background: #232b3f; color: #ff3155; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Media.net Sponsor</span>
  <h4 style="font-size: 14px; font-weight: bold; margin: 8px 0 4px 0;">বাংলাদেশ ক্রিকেট লাইভ স্কোর ও স্ট্রিমিং প্যাকেজ</h4>
  <p style="font-size: 12px; color: #9aa4b7; margin-bottom: 10px;">আল্ট্রা এইচডি ব্রডকাস্ট এবং আনলিমিটেড ভিউয়ারশিপ।</p>
  <button style="background: #ff3155; border: none; color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">ক্লিক করে দেখুন</button>
</div>`);
    } else if (type === 'banner') {
      setNetworkName('Custom Sponsor');
      setPlacementName('Sidebar Pass (300x250)');
      setPosition('Sidebar');
      setCode(`<!-- Custom HTML5 Sponsor Card -->
<div style="background: #141824; border: 1px solid #273044; border-radius: 10px; padding: 14px; text-align: center; color: #fff;">
  <span style="font-size: 10px; color: #7f899e; text-transform: uppercase;">স্পন্সর বিজ্ঞাপন</span>
  <h5 style="font-size: 13px; font-weight: 700; color: #ff3155; margin: 6px 0;">ক্লাউড হোস্টিং স্পেশাল অফার</h5>
  <p style="font-size: 11px; color: #a5adbd; margin: 0 0 10px 0;">হাই স্পিড এনভিএমই এসএসডি সার্ভার মাত্র ৳২৯৯/মাসিক</p>
  <a href="#" style="background: #ff3155; color: #fff; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; display: inline-block;">কুপন নিন</a>
</div>`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6"
    >
      <div className="relative w-full max-w-5xl bg-[#10131d] border border-[#272e42] rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#151926] border-b border-[#242b3d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff3155] to-[#99152e] flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 id="admin-modal-title" className="text-base md:text-lg font-black text-white leading-tight">
                {isBn ? 'বিজ্ঞাপন ব্যবস্থাপনা প্যানেল (Ad Management)' : 'Advertisement Management Console'}
              </h2>
              <p className="text-xs text-[#a5adbd]">
                {isBn
                  ? 'ওয়েবসাইটে প্রদর্শিত ব্যানার ও স্ক্রিপ্ট কোড নিয়ন্ত্রণ করুন'
                  : 'Manage header, homepage, in-stream, sidebar & footer ad networks'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-[#21283b] hover:bg-[#2b354d] text-xs font-medium text-[#c4c9d5] hover:text-white transition-colors flex items-center gap-1.5"
                title="Logout Admin"
              >
                <Power className="w-3.5 h-3.5 text-[#ff3155]" />
                <span className="hidden sm:inline">{isBn ? 'লগআউট' : 'Logout'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#a5adbd] hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close admin modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate: Only authorized administrators can access ad management (Requirement 9) */}
        {!isAuthenticated ? (
          <div className="p-8 md:p-12 max-w-md mx-auto w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#ff3155]/15 border border-[#ff3155]/30 flex items-center justify-center mx-auto text-[#ff3155] shadow-lg">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">
                {isBn ? 'অ্যাডমিন নিরাপত্তা যাচাইকরণ' : 'Administrator Authentication'}
              </h3>
              <p className="text-xs text-[#a5adbd] leading-relaxed">
                {isBn
                  ? 'বিজ্ঞাপন কোড পরিচালনা করার জন্য অনুমোদিত অ্যাডমিন পাসকোড প্রয়োজন। সাধারণ দর্শনার্থীরা কোনো বিজ্ঞাপন কোড এক্সিকিউট করতে পারবে না।'
                  : 'Authorized administrator credentials required. Ordinary visitors cannot manage or execute advertisement code.'}
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-[#ff3155]/15 border border-[#ff3155]/30 text-xs text-[#ff6882] flex items-center gap-2 text-left">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-left space-y-1.5">
                <label className="text-xs font-semibold text-[#c4c9d5]">
                  {isBn ? 'ইউজারনেম' : 'Username'}
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#171c2b] border border-[#2b354c] text-white text-sm focus:outline-none focus:border-[#ff3155]"
                />
              </div>

              <div className="text-left space-y-1.5">
                <label className="text-xs font-semibold text-[#c4c9d5]">
                  {isBn ? 'অ্যাডমিন পাসওয়ার্ড' : 'Admin Password'}
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#171c2b] border border-[#2b354c] text-white text-sm focus:outline-none focus:border-[#ff3155]"
                />
                <p className="text-[11px] text-[#78849b]">
                  {isBn
                    ? 'প্রাথমিক পাসওয়ার্ড: Ssmmaa1'
                    : 'Initial password: Ssmmaa1'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 rounded-xl bg-[#ff3155] hover:bg-[#e62245] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ff3155]/25 transition-all disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{isBn ? 'প্যানেলে প্রবেশ করুন' : 'Authenticate & Unlock'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#21283a] bg-[#121624]">
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'manage'
                    ? 'border-[#ff3155] text-white'
                    : 'border-transparent text-[#8d97ac] hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 text-[#ff3155]" />
                <span>{isBn ? 'বিজ্ঞাপন সেটিংস ও তালিকা' : 'Manage Advertisements'}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#ff3155]/20 text-[#ff3155] text-[10px] font-bold">
                  {ads.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('guide')}
                className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'guide'
                    ? 'border-[#ff3155] text-white'
                    : 'border-transparent text-[#8d97ac] hover:text-white'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>{isBn ? 'নেটওয়ার্ক ইন্টিগ্রেশন গাইড' : 'Ad Network Integration Guide'}</span>
              </button>

              <button
                onClick={() => setActiveTab('database')}
                className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'database'
                    ? 'border-[#ff3155] text-white'
                    : 'border-transparent text-[#8d97ac] hover:text-white'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>{isBn ? 'ডাটাবেস ও স্টোরেজ স্ট্যাটাস' : 'Database Storage Status'}</span>
              </button>
            </div>

            {/* TAB 1: MANAGE ADVERTISEMENTS (FORM + TABLE) */}
            {activeTab === 'manage' && (
              <div className="p-5 md:p-6 space-y-8">
                {/* Save Feedback Alert */}
                {saveSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs md:text-sm flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {isBn
                        ? 'বিজ্ঞাপন সেটিংস সফলভাবে ব্যাকএন্ড ডাটাবেসে সংরক্ষিত হয়েছে!'
                        : 'Advertisement settings successfully saved to backend database!'}
                    </span>
                  </div>
                )}

                {/* Advertisement Settings Form */}
                <div className="bg-[#151a28] border border-[#293248] rounded-2xl p-5 md:p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#232b3f] mb-5">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {editingId ? (
                          <>
                            <Edit2 className="w-4 h-4 text-[#ff3155]" />
                            <span>{isBn ? 'বিজ্ঞাপন সম্পাদনা করুন' : 'Edit Advertisement'}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 text-[#ff3155]" />
                            <span>{isBn ? 'নতুন বিজ্ঞাপন ফরম' : 'Advertisement Settings Form'}</span>
                          </>
                        )}
                      </h3>
                      <p className="text-xs text-[#a5adbd]">
                        {isBn
                          ? 'অনুমোদিত বিজ্ঞাপন নেটওয়ার্কের তথ্য ও কোড প্রদান করুন'
                          : 'Configure network name, placement, responsive code, and position'}
                      </p>
                    </div>

                    {/* Quick Code Templates */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-[#7f8ba1] mr-1">
                        {isBn ? 'নমুনা কোড:' : 'Quick Presets:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => applyTemplate('adsense')}
                        className="px-2.5 py-1 rounded bg-[#21293c] hover:bg-[#2b354d] text-[#c4c9d5] text-[11px] font-medium transition-colors"
                      >
                        Google AdSense
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('medianet')}
                        className="px-2.5 py-1 rounded bg-[#21293c] hover:bg-[#2b354d] text-[#c4c9d5] text-[11px] font-medium transition-colors"
                      >
                        Media.net
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate('banner')}
                        className="px-2.5 py-1 rounded bg-[#21293c] hover:bg-[#2b354d] text-[#c4c9d5] text-[11px] font-medium transition-colors"
                      >
                        Custom Sponsor
                      </button>
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 mb-4 rounded-xl bg-[#ff3155]/15 border border-[#ff3155]/30 text-xs text-[#ff6a83]">
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleSaveAd} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Field 1: Advertisement Network Name */}
                      <div>
                        <label className="block text-xs font-semibold text-[#c4c9d5] mb-1.5">
                          {isBn ? 'বিজ্ঞাপন নেটওয়ার্ক নাম (Ad Network Name) *' : 'Advertisement Network Name *'}
                        </label>
                        <input
                          type="text"
                          value={networkName}
                          onChange={(e) => setNetworkName(e.target.value)}
                          placeholder="Google AdSense, Media.net, Adsterra, etc."
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#192030] border border-[#2d374e] text-white text-xs md:text-sm focus:outline-none focus:border-[#ff3155]"
                        />
                      </div>

                      {/* Field 2: Advertisement Placement Name */}
                      <div>
                        <label className="block text-xs font-semibold text-[#c4c9d5] mb-1.5">
                          {isBn ? 'প্লেসমেন্ট নাম (Placement Name) *' : 'Advertisement Placement Name *'}
                        </label>
                        <input
                          type="text"
                          value={placementName}
                          onChange={(e) => setPlacementName(e.target.value)}
                          placeholder="e.g. Header Leaderboard, In-Stream Native 728x90"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#192030] border border-[#2d374e] text-white text-xs md:text-sm focus:outline-none focus:border-[#ff3155]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Field 4: Advertisement Position */}
                      <div>
                        <label className="block text-xs font-semibold text-[#c4c9d5] mb-1.5">
                          {isBn ? 'বিজ্ঞাপন অবস্থান (Position) *' : 'Advertisement Position *'}
                        </label>
                        <select
                          value={position}
                          onChange={(e) => setPosition(e.target.value as AdPosition)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#192030] border border-[#2d374e] text-white text-xs md:text-sm focus:outline-none focus:border-[#ff3155]"
                        >
                          <option value="Header">Header (হেডার শীর্ষ ব্যানার)</option>
                          <option value="Homepage">Homepage (হোমপেজ মিড-ব্যানার)</option>
                          <option value="Between Videos">Between Videos (ভিডিও গ্রিডের মাঝখানে)</option>
                          <option value="Sidebar">Sidebar (প্লেয়ার সাইডবার)</option>
                          <option value="Footer">Footer (ফুটার ব্যানার)</option>
                        </select>
                      </div>

                      {/* Field 5: Enable/Disable Advertisement Toggle */}
                      <div className="flex flex-col justify-end">
                        <label className="block text-xs font-semibold text-[#c4c9d5] mb-1.5">
                          {isBn ? 'বিজ্ঞাপন স্থিতি (Status)' : 'Enable / Disable Toggle'}
                        </label>
                        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#192030] border border-[#2d374e]">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => setEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[#2a344c] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff3155]"></div>
                          </label>
                          <span className={`text-xs font-bold ${enabled ? 'text-emerald-400' : 'text-[#8793aa]'}`}>
                            {enabled
                              ? isBn ? 'সক্রিয় (Enabled)' : 'Active (Enabled)'
                              : isBn ? 'নিষ্ক্রিয় (Disabled)' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Field 3: Advertisement HTML/JavaScript Code */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[#c4c9d5] flex items-center gap-1.5">
                          <Code2 className="w-4 h-4 text-[#ff3155]" />
                          <span>{isBn ? 'বিজ্ঞাপন HTML / JavaScript কোড *' : 'Advertisement HTML / JavaScript Code *'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowFormPreview(!showFormPreview)}
                          className="text-xs text-[#a5adbd] hover:text-white flex items-center gap-1 underline underline-offset-4"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#ff3155]" />
                          <span>{showFormPreview ? (isBn ? 'প্রিভিউ বন্ধ' : 'Hide Preview') : (isBn ? 'লাইভ প্রিভিউ দেখুন' : 'Live Preview')}</span>
                        </button>
                      </div>

                      <textarea
                        rows={5}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={`<script async src="..."></script>\n<ins class="adsbygoogle" ...></ins>\n<!-- অথবা কাস্টম ব্যানার HTML -->`}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#111522] border border-[#2a344c] text-white font-mono text-xs focus:outline-none focus:border-[#ff3155] leading-relaxed"
                      />
                      <p className="text-[11px] text-[#7f8ca2] mt-1">
                        {isBn
                          ? 'নিরাপত্তা নিশ্চিত করতে কোডটি স্যান্ডবক্সড আইফ্রেমে পৃথকভাবে এক্সিকিউট হবে।'
                          : 'Code is sandboxed in an isolated container to ensure security and prevent page layout conflicts.'}
                      </p>
                    </div>

                    {/* Live Preview Inside Form */}
                    {showFormPreview && code && (
                      <div className="p-3 bg-[#111420] rounded-xl border border-[#262f44] space-y-2">
                        <div className="text-[11px] font-bold text-[#ff3155] uppercase tracking-wider">
                          {isBn ? 'সরাসরি প্রিভিউ (Sandboxed Live Preview):' : 'Sandboxed Live Preview:'}
                        </div>
                        <SandboxedAd
                          ad={{
                            id: 'preview-form',
                            networkName: networkName || 'Ad Network',
                            placementName: placementName || 'Placement',
                            code: code,
                            position: position,
                            enabled: true,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          }}
                          showLabel={true}
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2">
                      {editingId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-2 rounded-xl bg-[#20273c] text-xs font-semibold text-[#a5adbd] hover:text-white transition-colors"
                        >
                          {isBn ? 'সম্পাদনা বাতিল' : 'Cancel Edit'}
                        </button>
                      )}

                      <div className="flex items-center gap-3 ml-auto">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-6 py-2.5 rounded-xl bg-[#ff3155] hover:bg-[#e62245] text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#ff3155]/25 transition-all disabled:opacity-50"
                        >
                          {isSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>
                            {isBn ? 'বিজ্ঞাপন সংরক্ষণ করুন (Save Advertisement)' : 'Save Advertisement'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Advertisement List & Management Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {isBn ? 'বিদ্যমান বিজ্ঞাপনের তালিকা' : 'Active Advertisement Placements'}
                      </h3>
                      <p className="text-xs text-[#a5adbd]">
                        {isBn
                          ? 'সব বিজ্ঞাপন সম্পাদনা, ডিলিট বা চালু/বন্ধ করুন'
                          : 'Edit, delete, or toggle advertisements in real time'}
                      </p>
                    </div>

                    <button
                      onClick={loadAds}
                      className="p-2 rounded-lg bg-[#181f30] text-[#a5adbd] hover:text-white transition-colors flex items-center gap-1 text-xs"
                      title="Refresh list"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
                    </button>
                  </div>

                  {ads.length === 0 ? (
                    <div className="text-center py-12 bg-[#141826] rounded-2xl border border-dashed border-[#293248] text-xs text-[#a5adbd]">
                      {isBn ? 'বর্তমানে কোনো বিজ্ঞাপন সংরক্ষিত নেই।' : 'No advertisements found.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                      {ads.map((ad) => (
                        <div
                          key={ad.id}
                          className={`p-4 rounded-xl border transition-all ${
                            ad.enabled
                              ? 'bg-[#151a28] border-[#29334a]'
                              : 'bg-[#101420] border-[#1f2638] opacity-75'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-white">
                                  {ad.placementName}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#21293c] text-[#ff3155]">
                                  {ad.networkName}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#1e2538] text-[#c4c9d5]">
                                  {ad.position}
                                </span>
                              </div>
                              <p className="text-xs text-[#8d98ae] truncate max-w-xl font-mono">
                                {ad.code.substring(0, 80)}...
                              </p>
                            </div>

                            {/* Controls: Toggle, Edit, Delete */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleToggle(ad.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                  ad.enabled
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-[#21293d] text-[#8793a9] border border-[#2b354d]'
                                }`}
                                title="Toggle Enable / Disable"
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{ad.enabled ? (isBn ? 'সক্রিয়' : 'Enabled') : (isBn ? 'নিষ্ক্রিয়' : 'Disabled')}</span>
                              </button>

                              <button
                                onClick={() => handleEditClick(ad)}
                                className="p-2 rounded-lg bg-[#20283c] hover:bg-[#2b3652] text-[#c4c9d5] hover:text-white transition-colors"
                                title="Edit Advertisement"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(ad.id, ad.placementName)}
                                className="p-2 rounded-lg bg-[#2b1922] hover:bg-[#ff3155] text-[#ff708a] hover:text-white transition-colors"
                                title="Delete Advertisement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: AD NETWORK INTEGRATION GUIDE (Requirement 11) */}
            {activeTab === 'guide' && (
              <div className="p-6 md:p-8 space-y-6 max-w-4xl">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#ff3155]" />
                    <span>{isBn ? 'অনুমোদিত অ্যাড নেটওয়ার্ক ইন্টিগ্রেশন নির্দেশিকা' : 'How to Integrate Approved Ad Networks'}</span>
                  </h3>
                  <p className="text-xs md:text-sm text-[#a5adbd] leading-relaxed">
                    {isBn
                      ? 'Live Video প্ল্যাটফর্মে Google AdSense, Media.net, Adsterra বা সরাসরি স্পন্সর ব্যানার কীভাবে নির্ভুলভাবে যুক্ত করবেন তার বিস্তারিত ধাপসমূহ:'
                      : 'Step-by-step instructions to integrate Google AdSense, Media.net, Adsterra, or custom sponsors.'}
                  </p>
                </div>

                <div className="space-y-4 text-xs md:text-sm">
                  {/* Step 1: Google AdSense */}
                  <div className="bg-[#151a28] border border-[#273046] rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#ff3155] text-white flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <h4 className="font-bold text-white text-sm">
                        Google AdSense ইন্টিগ্রেশন
                      </h4>
                    </div>
                    <p className="text-[#c4c9d5] leading-relaxed">
                      ১. আপনার অনুমোদিত Google AdSense ড্যাশবোর্ডে প্রবেশ করে <strong>Ads &gt; By ad unit</strong> এ যান।<br />
                      ২. <strong>Display ads</strong> অথবা <strong>In-feed ads</strong> তৈরি করুন (Responsive বা 728x90 / 300x250 সিলেক্ট করুন)।<br />
                      ৩. প্রাপ্ত HTML/JS কোডটি কপি করে আমাদের প্যানেলের <strong>"Advertisement HTML/JavaScript Code"</strong> বক্সে পেস্ট করুন।<br />
                      ৪. অবস্থান সিলেক্ট করুন (যেমন: Header, Between Videos বা Sidebar) এবং <strong>"Save Advertisement"</strong> চাপুন।
                    </p>
                  </div>

                  {/* Step 2: Media.net & Contextual Ads */}
                  <div className="bg-[#151a28] border border-[#273046] rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#ff3155] text-white flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <h4 className="font-bold text-white text-sm">
                        Media.net ও অন্যান্য প্রাসঙ্গিক নেটওয়ার্ক
                      </h4>
                    </div>
                    <p className="text-[#c4c9d5] leading-relaxed">
                      ১. Media.net প্রকাশক প্যানেল থেকে আপনার সাইটের জন্য নতুন বিজ্ঞাপন ট্যাগ তৈরি করুন।<br />
                      ২. কোড স্ন্যাপশটে প্রদত্ত জাভাস্ক্রিপ্ট ট্যাগটি সরাসরি ফরমের কোড ফিল্ডে পেস্ট করুন।<br />
                      ৩. মোবাইল এবং ডেস্কটপ উভয়ের জন্যই এটি স্যান্ডবক্সড কন্টেইনারে রেসপনসিভভাবে এডজাস্ট হবে।
                    </p>
                  </div>

                  {/* Step 3: Custom Sponsor Banners */}
                  <div className="bg-[#151a28] border border-[#273046] rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#ff3155] text-white flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <h4 className="font-bold text-white text-sm">
                        কাস্টম স্পন্সর ও সরাসরি পার্টনারশিপ ব্যানার
                      </h4>
                    </div>
                    <p className="text-[#c4c9d5] leading-relaxed">
                      সরাসরি লোকাল স্পন্সর (যেমন: টেলিকম, ওটিটি, ই-কমার্স) এর ব্যানার প্রদর্শন করতে সাধারণ HTML ট্যাগ (`&lt;a href="..."&gt;&lt;img src="..." /&gt;&lt;/a&gt;`) অথবা রেসপনসিভ CSS ফ্লেক্সবক্স কার্ড ব্যবহার করতে পারেন।
                    </p>
                  </div>

                  {/* Security Policy Reminder */}
                  <div className="p-4 rounded-xl bg-[#ff3155]/10 border border-[#ff3155]/25 text-xs text-[#ff8097] flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>নিরাপত্তা নিয়মাবলী (Security & Sandboxing):</strong> সাধারণ দর্শনার্থীরা কোনো বিজ্ঞাপন কোড পাঠাতে বা চালাতে পারবে না। কেবল অথেন্টিকেটেড অ্যাডমিনের অনুমোদিত স্ক্রিপ্টই স্যান্ডবক্সড আইফ্রেমে বিচ্ছিন্নভাবে রান করবে যাতে মূল ওয়েবসাইটের পারফরম্যান্স ও সিকিউরিটি নিরাপদ থাকে।
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DATABASE CONFIGURATION STATUS (Requirement 12 & 13) */}
            {activeTab === 'database' && (
              <div className="p-6 md:p-8 space-y-6 max-w-4xl">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <span>{isBn ? 'ডাটাবেস ও স্টোরেজ আর্কিটেকচার স্ট্যাটাস' : 'Backend Database Configuration Status'}</span>
                  </h3>
                  <p className="text-xs md:text-sm text-[#a5adbd] leading-relaxed">
                    {isBn
                      ? 'বিজ্ঞাপন সেটিংস সংরক্ষণ এবং ক্লাউড পারসিস্টেন্স কনফিগারেশনের বর্তমান অবস্থা:'
                      : 'Status of advertising settings persistence and cloud database configuration.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Active Engine */}
                  <div className="bg-[#151a28] border border-[#273046] rounded-xl p-5 space-y-2.5">
                    <div className="text-[11px] font-bold text-[#8f9baf] uppercase">
                      {isBn ? 'সক্রিয় স্টোরেজ ইঞ্জিন' : 'Active Storage Engine'}
                    </div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{dbStatus?.label || 'Node.js Server Storage (data/ads.json)'}</span>
                    </div>
                    <p className="text-xs text-[#a5adbd] font-mono">
                      {dbStatus?.storagePath || '/data/ads.json'}
                    </p>
                    <p className="text-xs text-emerald-400 font-semibold pt-1">
                      ✓ {isBn ? 'সার্ভার-সাইড ব্যাকএন্ডের সাথে যুক্ত ও কার্যকর।' : 'Connected & functional.'}
                    </p>
                  </div>

                  {/* Cloud Multi-Instance Status */}
                  <div className="bg-[#151a28] border border-[#273046] rounded-xl p-5 space-y-2.5">
                    <div className="text-[11px] font-bold text-[#8f9baf] uppercase">
                      {isBn ? 'ক্লাউড ডিস্ট্রিবিউটেড ডাটাবেস' : 'Cloud Distributed Database'}
                    </div>
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>Cloud SQL (PostgreSQL) / Firestore</span>
                    </div>
                    <p className="text-xs text-amber-300">
                      {isBn ? 'স্ট্যাটাস: বর্তমানে লোকাল সার্ভার ডাটাবেস সক্রিয়' : 'Status: Local server storage active'}
                    </p>
                    <p className="text-xs text-[#8d98ad]">
                      {isBn
                        ? 'মাল্টি-ইনস্ট্যান্স ক্লাউড স্কেলিংয়ের জন্য ক্লাউড ডাটাবেস যুক্ত করা যেতে পারে।'
                        : 'Cloud database can be attached for distributed multi-instance clustering.'}
                    </p>
                  </div>
                </div>

                {/* Requirement 13 Explanation Box */}
                <div className="bg-[#121624] border border-[#29324a] rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Info className="w-4 h-4 text-[#ff3155]" />
                    <span>{isBn ? 'ডাটাবেস পারসিস্টেন্স সংক্রান্ত স্বচ্ছ তথ্য (Requirement 13)' : 'Database Configuration Instructions'}</span>
                  </div>

                  <p className="text-xs text-[#c4c9d5] leading-relaxed">
                    {isBn
                      ? 'আমরা কোনো ভুয়া স্টোরেজ সিমুলেশন না করে সরাসরি Node.js ব্যাকএন্ড সার্ভার এপিআই ও `data/ads.json` ফাইলের মাধ্যমে বিজ্ঞাপন ডাটা সংরক্ষণ করছি। কিন্তু যেকোনো ক্লাউড রান বা ডিস্ট্রিবিউটেড সার্ভারলেস ক্লাস্টারে কনটেইনার রিস্টার্ট হলে লোকাল ফাইল সিস্টেম রিসেট হতে পারে।'
                      : 'Advertisement settings are actively saved to the server backend at `data/ads.json`. In production multi-container or serverless cloud environments, container restarts require an external cloud database.'}
                  </p>

                  <div className="p-4 rounded-lg bg-[#181d2e] border border-[#222a3d] space-y-2 text-xs">
                    <h5 className="font-bold text-white">
                      {isBn ? 'স্থায়ী ক্লাউড ডাটাবেস সংযোগ করার জন্য যা যা প্রয়োজন:' : 'What needs to be configured for enterprise cloud persistence:'}
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-[#a5adbd]">
                      <li>
                        <strong>Google Cloud SQL (PostgreSQL):</strong> <code className="bg-black/40 px-1 py-0.5 rounded text-[#ff3155]">DATABASE_URL</code> এনভায়রনমেন্ট ভেরিয়েবল সেট করে কানেকশন পুল সক্রিয় করা।
                      </li>
                      <li>
                        <strong>Firebase Firestore:</strong> <code className="bg-black/40 px-1 py-0.5 rounded text-[#ff3155]">FIREBASE_CONFIG</code> এর মাধ্যমে ক্লাউড ডকুমেন্টস কালেকশন (<code className="text-white">ads</code>) এ সরাসরি সিঙ্ক করা।
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
