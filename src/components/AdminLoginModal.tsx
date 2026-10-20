import React, { useState } from 'react';
import {
  X,
  Lock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { AuthService } from '../services/authService';

interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (mustChangePassword: boolean) => void;
  lang: 'bn' | 'en';
  forceChangePassword?: boolean;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onClose,
  onLoginSuccess,
  lang,
  forceChangePassword = false,
}) => {
  const isBn = lang === 'bn';

  // Screen mode: 'login' | 'change_password'
  const [mode, setMode] = useState<'login' | 'change_password'>(
    forceChangePassword ? 'change_password' : 'login'
  );

  // Login Form
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await AuthService.login(username.trim(), password);
      if (res.success) {
        if (res.mustChangePassword) {
          // Immediately switch to mandatory Change Password view (Requirements 4 & 5)
          setCurrentPassword(password); // Pre-fill current password for convenience
          setMode('change_password');
          setError('');
          setSuccessMsg(
            isBn
              ? 'প্রথমবার লগইন সফল হয়েছে! নিরাপত্তার জন্য অনুগ্রহ করে এখনই পাসওয়ার্ড পরিবর্তন করুন।'
              : 'Initial login verified. You must change your initial password before accessing the dashboard.'
          );
        } else {
          onLoginSuccess(false);
          onClose();
        }
      } else {
        setError(res.error || (isBn ? 'লগইন ব্যর্থ হয়েছে।' : 'Authentication failed.'));
      }
    } catch {
      setError(isBn ? 'সার্ভার সংযোগে ত্রুটি হয়েছে।' : 'Connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Change Password Submit (Requirements 5 & 6)
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError(
        isBn
          ? 'নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।'
          : 'New password and confirm password do not match.'
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        isBn
          ? 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.changePassword(
        currentPassword,
        newPassword,
        confirmNewPassword
      );

      if (res.success) {
        setSuccessMsg(
          isBn
            ? 'পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে! পুরাতন পাসওয়ার্ড আর কাজ করবে না।'
            : 'Password updated successfully! The old password has been permanently revoked.'
        );
        setTimeout(() => {
          onLoginSuccess(false);
          onClose();
        }, 1500);
      } else {
        setError(res.error || (isBn ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' : 'Failed to change password.'));
      }
    } catch {
      setError(isBn ? 'সার্ভার সংযোগে ত্রুটি হয়েছে।' : 'Connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-auth-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="relative w-full max-w-md bg-[#131724] border border-[#273046] rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 my-6">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8e98ac] hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close auth modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff3155] to-[#a31530] flex items-center justify-center mx-auto text-white shadow-lg shadow-[#ff3155]/25">
            {mode === 'login' ? <Lock className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
          </div>

          <h2 id="admin-auth-title" className="text-xl font-black text-white">
            {mode === 'login'
              ? isBn
                ? 'অ্যাডমিনিস্ট্রেটর লগইন'
                : 'Administrator Login'
              : isBn
              ? 'পাসওয়ার্ড পরিবর্তন করুন'
              : 'Change Administrator Password'}
          </h2>

          <p className="text-xs text-[#a5adbd] max-w-xs mx-auto leading-relaxed">
            {mode === 'login'
              ? isBn
                ? 'ভিডিও আপলোড, সম্পাদনা ও বিজ্ঞাপন নিয়ন্ত্রণের জন্য অ্যাডমিন অ্যাকাউন্টে প্রবেশ করুন'
                : 'Authorized access to video management and advertisement controls'
              : isBn
              ? 'নিরাপত্তা নীতি: ড্যাশবোর্ডে প্রবেশের পূর্বে প্রাথমিক পাসওয়ার্ড পরিবর্তন আবশ্যক'
              : 'Security requirement: Change your initial password before accessing dashboard'}
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="p-3.5 rounded-xl bg-[#ff3155]/15 border border-[#ff3155]/30 text-xs text-[#ff6882] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ---------------- MODE 1: LOGIN FORM ---------------- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#c4c9d5] mb-1.5">
                {isBn ? 'ইউজারনেম (Username)' : 'Username'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2133] border border-[#2d3850] text-white text-xs md:text-sm focus:outline-none focus:border-[#ff3155]"
                />
                <UserCheck className="w-4 h-4 text-[#7d889e] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#c4c9d5] mb-1.5">
                {isBn ? 'পাসওয়ার্ড (Password)' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#1a2133] border border-[#2d3850] text-white text-xs md:text-sm focus:outline-none focus:border-[#ff3155]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d889e] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#738096] mt-1.5">
                {isBn ? 'প্রাথমিক অনুমোদিত পাসওয়ার্ড: Ssmmaa1' : 'Initial default password: Ssmmaa1'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#ff3155] hover:bg-[#e62245] text-white text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ff3155]/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>{isBn ? 'অ্যাডমিন লগইন করুন' : 'Sign In as Administrator'}</span>
            </button>
          </form>
        )}

        {/* ---------------- MODE 2: CHANGE PASSWORD FORM (Requirements 4, 5, 6) ---------------- */}
        {mode === 'change_password' && (
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div className="p-3 bg-[#171e2e] border border-[#29354e] rounded-xl text-xs text-[#a5adbd] space-y-1">
              <span className="font-bold text-[#ff3155] block">
                {isBn ? 'নতুন পাসওয়ার্ড সেট করুন:' : 'Set your new secure password:'}
              </span>
              <p>
                {isBn
                  ? 'প্রথমবার সফল লগইনের পর প্রাথমিক পাসওয়ার্ডটি পরিবর্তন করা বাধ্যতামূলক। পরিবর্তনের পর পুরাতন পাসওয়ার্ড দিয়ে আর প্রবেশ করা যাবে না।'
                  : 'You must change the initial password before accessing the dashboard. The old password will be revoked.'}
              </p>
            </div>

            {/* Field 1: Current password */}
            <div>
              <label className="block text-xs font-semibold text-[#c4c9d5] mb-1.5">
                {isBn ? 'বর্তমান পাসওয়ার্ড (Current password) *' : 'Current Password *'}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2133] border border-[#2d3850] text-white text-xs md:text-sm focus:outline-none focus:border-[#ff3155]"
              />
            </div>

            {/* Field 2: New password */}
            <div>
              <label className="block text-xs font-semibold text-[#c4c9d5] mb-1.5">
                {isBn ? 'নতুন পাসওয়ার্ড (New password) *' : 'New Password *'}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#1a2133] border border-[#2d3850] text-white text-xs md:text-sm focus:outline-none focus:border-[#ff3155]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d889e] hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field 3: Confirm new password */}
            <div>
              <label className="block text-xs font-semibold text-[#c4c9d5] mb-1.5">
                {isBn ? 'নতুন পাসওয়ার্ড নিশ্চিতকরণ (Confirm new password) *' : 'Confirm New Password *'}
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a2133] border border-[#2d3850] text-white text-xs md:text-sm focus:outline-none focus:border-[#ff3155]"
              />
            </div>

            {/* Save New Password button (Requirement 5) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#ff3155] hover:bg-[#e62245] text-white text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ff3155]/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>{isBn ? 'পাসওয়ার্ড সংরক্ষণ করুন (Save New Password)' : 'Save New Password'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
