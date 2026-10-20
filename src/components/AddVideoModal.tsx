import React, { useState, useEffect } from 'react';
import { X, Plus, Video, Sparkles, Check, Lock, Edit3 } from 'lucide-react';
import { VideoItem, Language } from '../types/video';
import { CATEGORIES } from '../data/initialVideos';

interface AddVideoModalProps {
  onClose: () => void;
  onSaveVideo: (videoData: Partial<VideoItem>, id?: string) => Promise<boolean>;
  editingVideo?: VideoItem | null;
  isAdmin: boolean;
  onRequestLogin: () => void;
  lang: Language;
}

export const AddVideoModal: React.FC<AddVideoModalProps> = ({
  onClose,
  onSaveVideo,
  editingVideo = null,
  isAdmin,
  onRequestLogin,
  lang,
}) => {
  const isBn = lang === 'bn';

  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [channelName, setChannelName] = useState('');
  const [category, setCategory] = useState('নাটক');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('১০:১৫');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingVideo) {
      setTitle(editingVideo.title);
      setVideoUrl(editingVideo.videoUrl);
      setChannelName(editingVideo.channelName);
      setCategory(editingVideo.category);
      setDescription(editingVideo.description || '');
      setDuration(editingVideo.duration || '১০:০০');
      setThumbnailUrl(editingVideo.thumbnail || '');
      setIsLive(Boolean(editingVideo.isLive));
    } else {
      setTitle('');
      setVideoUrl('');
      setChannelName('');
      setCategory('নাটক');
      setDescription('');
      setDuration('১০:১৫');
      setThumbnailUrl('');
      setIsLive(false);
    }
  }, [editingVideo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError(
        isBn
          ? 'শুধুমাত্র অনুমোদিত অ্যাডমিন ভিডিও আপলোড বা সম্পাদনা করতে পারবেন।'
          : 'Only authenticated administrators can upload or edit videos.'
      );
      return;
    }

    if (!title.trim()) {
      setError(isBn ? 'ভিডিওর শিরোনাম প্রদান করুন' : 'Please provide a video title');
      return;
    }
    if (!videoUrl.trim()) {
      setError(isBn ? 'ভিডিওর কার্যকর লিংক (YouTube বা MP4) প্রদান করুন' : 'Please provide a valid video URL');
      return;
    }

    const matchedCat = CATEGORIES.find((c) => c.id === category);

    const videoData: Partial<VideoItem> = {
      title: title.trim(),
      channelName: channelName.trim() || 'Live Video Creator',
      category: category,
      categoryEn: matchedCat ? matchedCat.labelEn : 'General',
      duration: duration.trim() || '১০:০০',
      thumbnail:
        thumbnailUrl.trim() ||
        '/src/assets/images/hero_stream_cinema_1792327536011.jpg',
      videoUrl: videoUrl.trim(),
      isLive,
      description: description.trim(),
      tags: ['Video', category],
    };

    setSubmitting(true);
    try {
      const ok = await onSaveVideo(videoData, editingVideo?.id);
      if (ok) {
        onClose();
      } else {
        setError(isBn ? 'ভিডিও সংরক্ষণ করা যায়নি।' : 'Failed to save video.');
      }
    } catch {
      setError(isBn ? 'সার্ভার সংযোগে ত্রুটি।' : 'Server connection failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setTitle(isBn ? 'নতুন রোমাঞ্চকর বাংলা নাটক পর্ব' : 'New Thrilling Bengali Drama Episode');
    setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setChannelName('ঢাকা ড্রামা প্রোডাকশন');
    setCategory('নাটক');
    setDescription(isBn ? 'একটি দুর্দান্ত চিত্রনাট্য এবং চমৎকার সিনেমাটোগ্রাফির দৃশ্য।' : 'A great screenplay and wonderful cinematography.');
    setDuration('০৯:৪৫');
    setError('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="relative w-full max-w-lg bg-[#151925] border border-[#2b3144] rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-[#252938] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ff3155]/20 flex items-center justify-center text-[#ff3155]">
              {editingVideo ? <Edit3 className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </div>
            <h2 id="video-modal-title" className="text-base font-bold text-white">
              {editingVideo
                ? isBn ? 'ভিডিও সম্পাদনা করুন' : 'Edit Video'
                : isBn ? 'নতুন ভিডিও আপলোড করুন (Admin Only)' : 'Upload New Video (Admin Only)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#8f98aa] hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not authenticated warning (Requirement 10) */}
        {!isAdmin && (
          <div className="p-4 rounded-xl bg-[#ff3155]/15 border border-[#ff3155]/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#ff6a83]">
              <Lock className="w-4 h-4" />
              <span>
                {isBn
                  ? 'নিরাপত্তা নীতি: শুধুমাত্র অনুমোদিত অ্যাডমিনিস্ট্রেটর ভিডিও যোগ বা সম্পাদনা করতে পারবেন।'
                  : 'Security Policy: Only authenticated administrators can upload or manage videos.'}
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onRequestLogin();
              }}
              className="w-full py-2 px-3 rounded-lg bg-[#ff3155] hover:bg-[#e62245] text-white text-xs font-bold transition-colors"
            >
              {isBn ? 'অ্যাডমিন হিসেবে লগইন করুন' : 'Sign in as Administrator'}
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-[#ff3155]/15 border border-[#ff3155]/30 text-[#ff7088] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
          <div>
            <label className="block text-xs font-semibold text-[#a5adbd] mb-1">
              {isBn ? 'ভিডিও শিরোনাম *' : 'Video Title *'}
            </label>
            <input
              type="text"
              value={title}
              disabled={!isAdmin}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isBn ? 'যেমন: সুন্দর সন্ধ্যার বিশেষ নাটক...' : 'e.g., Acoustic Melody Session...'}
              className="w-full px-3 py-2 rounded-lg bg-[#1b2030] border border-[#303547] text-white focus:outline-none focus:border-[#ff3155] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a5adbd] mb-1">
              {isBn ? 'ভিডিও লিংক (YouTube অথবা MP4 URL) *' : 'Video URL (YouTube or MP4) *'}
            </label>
            <input
              type="url"
              value={videoUrl}
              disabled={!isAdmin}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://... বা https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-lg bg-[#1b2030] border border-[#303547] text-white focus:outline-none focus:border-[#ff3155] disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a5adbd] mb-1">
                {isBn ? 'চ্যানেল / নির্মাতার নাম' : 'Channel Name'}
              </label>
              <input
                type="text"
                value={channelName}
                disabled={!isAdmin}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder={isBn ? 'চ্যানেল নাম' : 'Channel'}
                className="w-full px-3 py-2 rounded-lg bg-[#1b2030] border border-[#303547] text-white focus:outline-none focus:border-[#ff3155] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a5adbd] mb-1">
                {isBn ? 'ক্যাটাগরি' : 'Category'}
              </label>
              <select
                value={category}
                disabled={!isAdmin}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1b2030] border border-[#303547] text-white focus:outline-none focus:border-[#ff3155] disabled:opacity-50"
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {isBn ? c.labelBn : c.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#a5adbd] mb-1">
                {isBn ? 'ভিডিও দৈর্ঘ্য' : 'Duration'}
              </label>
              <input
                type="text"
                value={duration}
                disabled={!isAdmin}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="যেমন: ১২:৩০"
                className="w-full px-3 py-2 rounded-lg bg-[#1b2030] border border-[#303547] text-white focus:outline-none focus:border-[#ff3155] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a5adbd] mb-1">
                {isBn ? 'থাম্বনেইল ইমেজ URL (ঐচ্ছিক)' : 'Thumbnail URL'}
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                disabled={!isAdmin}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-[#1b2030] border border-[#303547] text-white focus:outline-none focus:border-[#ff3155] disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a5adbd] mb-1">
              {isBn ? 'সংক্ষিপ্ত বিবরণ' : 'Description'}
            </label>
            <textarea
              rows={2}
              value={description}
              disabled={!isAdmin}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isBn ? 'ভিডিও সম্পর্কে কিছু লিখুন...' : 'Brief description of the video...'}
              className="w-full px-3 py-2 rounded-lg bg-[#1b2030] border border-[#303547] text-white focus:outline-none focus:border-[#ff3155] disabled:opacity-50"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {isAdmin && !editingVideo && (
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs text-[#a5adbd] hover:text-white flex items-center gap-1 underline underline-offset-4"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#ff3155]" />
                <span>{isBn ? 'নমুনা তথ্য পূরণ করুন' : 'Auto-fill Sample'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#1b2030] text-[#a5adbd] hover:text-white transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              {isAdmin && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-[#ff3155] hover:bg-[#e62245] text-white font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-[#ff3155]/25 disabled:opacity-50"
                >
                  {editingVideo ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingVideo ? (isBn ? 'আপডেট করুন' : 'Update Video') : (isBn ? 'যোগ করুন' : 'Add Video')}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
