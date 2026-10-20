import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ThumbsUp,
  Bookmark,
  Share2,
  Check,
  Send,
  Radio,
  Sparkles,
  Info,
  Film,
  ExternalLink,
} from 'lucide-react';
import { VideoItem, VideoComment, Language } from '../types/video';
import { Advertisement } from '../types/ad';
import { SandboxedAd } from './SandboxedAd';
import { getYouTubeEmbedUrl, extractYouTubeId } from '../utils/youtube';

interface VideoPlayerModalProps {
  video: VideoItem;
  allVideos: VideoItem[];
  sidebarAds?: Advertisement[];
  onClose: () => void;
  onSelectVideo: (video: VideoItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  lang: Language;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  allVideos,
  sidebarAds = [],
  onClose,
  onSelectVideo,
  isFavorite,
  onToggleFavorite,
  lang,
}) => {
  const isBn = lang === 'bn';
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Comments state
  const [comments, setComments] = useState<VideoComment[]>([
    {
      id: 'c1',
      author: 'আরিফ হোসেন',
      avatarText: 'আ',
      text: 'অসাধারণ কনটেন্ট! কোয়ালিটি এবং সাউন্ড দুটিই দারুণ হয়েছে। নিয়মিত এমন ভিডিও চাই।',
      timestamp: '১ ঘন্টা আগে',
      likes: 14,
    },
    {
      id: 'c2',
      author: 'ফারহানা ইসলাম',
      avatarText: 'ফ',
      text: 'বাংলা ভাষায় এমন মানসম্মত পরিবেশনা সত্যি প্রশংসনীয়। ধন্যবাদ লাইভ ভিডিও টিমকে।',
      timestamp: '৩ ঘন্টা আগে',
      likes: 8,
    },
    {
      id: 'c3',
      author: 'তানভীর আহমেদ',
      avatarText: 'ত',
      text: 'ফুল স্ক্রিনে দেখে খুব ভালো লাগলো। সাউন্ডট্র্যাকটা অসাধারণ!',
      timestamp: '৫ ঘন্টা আগে',
      likes: 5,
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentName, setNewCommentName] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle Like
  const handleLike = () => {
    if (hasLiked) {
      setLikesCount((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  // Handle Share
  const handleShare = () => {
    const shareUrl = `${window.location.origin}?v=${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  // Handle Speed Change
  const changeSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const author = newCommentName.trim() || (isBn ? 'দর্শনার্থী' : 'Guest Viewer');
    const newComment: VideoComment = {
      id: `c_${Date.now()}`,
      author,
      avatarText: author.charAt(0).toUpperCase(),
      text: newCommentText.trim(),
      timestamp: isBn ? 'এইমাত্র' : 'Just now',
      likes: 0,
    };

    setComments([newComment, ...comments]);
    setNewCommentText('');
  };

  // Check if YouTube
  const ytId = video.youtubeId || extractYouTubeId(video.videoUrl);
  const isYouTube = Boolean(
    ytId ||
      video.sourceType === 'youtube' ||
      video.videoUrl.includes('youtube.com') ||
      video.videoUrl.includes('youtu.be') ||
      video.videoUrl.includes('youtube-nocookie.com')
  );

  const officialEmbedUrl = ytId
    ? getYouTubeEmbedUrl(ytId, { autoplay: false, enablejsapi: true })
    : getYouTubeEmbedUrl(video.videoUrl, { autoplay: false, enablejsapi: true });

  const relatedVideos = allVideos.filter((v) => v.id !== video.id).slice(0, 6);

  const title = isBn ? video.title : (video.titleEn || video.title);
  const category = isBn ? video.category : video.categoryEn;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      <div className="relative w-full max-w-6xl bg-[#10131d] border border-[#252938] rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[96vh]">
        {/* Top bar inside modal */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#151925] border-b border-[#242a39]">
          <div className="flex items-center gap-2 truncate pr-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff3155]" />
            <h2 id="video-modal-title" className="text-sm font-semibold text-white truncate">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a5adbd] hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content: Player + Side recommendations */}
        <div className="overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Video Section (Left Column) */}
          <div className="lg:col-span-8 p-4 md:p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-[#242a39]">
            {/* Player Container */}
            <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-[#222839] group">
              {isYouTube ? (
                <iframe
                  src={officialEmbedUrl}
                  title={title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    src={video.videoUrl}
                    poster={video.thumbnail}
                    preload="metadata"
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full h-full object-contain"
                  />

                  {/* HTML5 Controls Overlay */}
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlay}
                        className="p-2 rounded-full bg-[#ff3155] text-white hover:bg-[#e62245] transition-colors"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                      </button>

                      <button
                        onClick={toggleMute}
                        className="p-1.5 text-white/90 hover:text-white transition-colors"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      {video.isLive ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#ff3155] text-white text-[11px] font-bold rounded">
                          <Radio className="w-3 h-3 animate-pulse" />
                          <span>LIVE</span>
                        </div>
                      ) : (
                        <span className="text-xs text-white/80 font-mono">
                          {video.duration}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={changeSpeed}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-colors"
                        title="Playback speed"
                      >
                        {speed}x
                      </button>

                      <button
                        onClick={toggleFullscreen}
                        className="p-1.5 text-white/90 hover:text-white transition-colors"
                        aria-label="Fullscreen"
                      >
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Official YouTube Compliance Badge / Notice (Requirement 2 & 5) */}
            {isYouTube && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#131724] rounded-xl border border-[#21283c] text-xs text-[#8e98ac]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff3155] animate-pulse shrink-0" />
                  <span className="font-bold text-white text-[13px]">
                    {isBn ? 'ইউটিউব অফিসিয়াল প্লেয়ার (Privacy-Enhanced)' : 'Official YouTube Privacy-Enhanced Player'}
                  </span>
                </div>
                <span className="text-[#8490a6] text-[11px] leading-tight">
                  {isBn
                    ? 'ইউটিউব পলিসি ও শর্তাবলী অনুযায়ী ভিডিওর ব্র্যান্ডিং, চ্যানেল তথ্য ও প্লেয়ার কন্ট্রোল ইউটিউব কর্তৃক সরাসরি পরিচালিত।'
                    : 'Channel branding, controls, and creator ads are officially governed by YouTube per Terms of Service.'}
                </span>
              </div>
            )}

            {/* Title & Metadata */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-lg md:text-xl font-bold text-white leading-snug">
                  {title}
                </h1>
              </div>

              {/* Action buttons strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-y border-[#202535]">
                {/* Channel information */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff3155] to-[#801b34] flex items-center justify-center font-bold text-white">
                    {video.channelName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {video.channelName}
                    </h4>
                    <span className="text-xs text-[#a5adbd]">
                      {category} • {video.views}
                    </span>
                  </div>
                </div>

                {/* Like, Save, Share */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                      hasLiked
                        ? 'bg-[#ff3155] text-white shadow-md shadow-[#ff3155]/20'
                        : 'bg-[#1b2030] text-[#c4c9d5] hover:text-white border border-[#2d3345]'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-white' : ''}`} />
                    <span>{likesCount.toLocaleString()}</span>
                  </button>

                  <button
                    onClick={() => onToggleFavorite(video.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                      isFavorite
                        ? 'bg-[#ff3155] text-white shadow-md shadow-[#ff3155]/20'
                        : 'bg-[#1b2030] text-[#c4c9d5] hover:text-white border border-[#2d3345]'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
                    <span>{isFavorite ? (isBn ? 'সংরক্ষিত' : 'Saved') : (isBn ? 'সংরক্ষণ' : 'Save')}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-[#1b2030] text-[#c4c9d5] hover:text-white border border-[#2d3345] transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied!') : (isBn ? 'শেয়ার' : 'Share')}</span>
                  </button>
                </div>
              </div>

              {/* Description Container */}
              <div className="bg-[#151925] p-3.5 rounded-xl border border-[#242a39] text-xs md:text-sm text-[#c4c9d5] space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#a5adbd] font-medium">
                  <span>{video.views}</span>
                  <span aria-hidden="true">·</span>
                  <span>{video.uploadedAt}</span>
                </div>

                <p className={`${showFullDesc ? '' : 'line-clamp-2'} leading-relaxed`}>
                  {video.description}
                </p>

                {video.description.length > 120 && (
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-xs text-[#ff3155] hover:underline font-medium"
                  >
                    {showFullDesc ? (isBn ? 'কম দেখুন' : 'Show less') : (isBn ? 'আরও পড়ুন' : 'Show more')}
                  </button>
                )}

                {video.tags && video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 text-xs text-[#a5adbd]">
                    {video.tags.map((tag) => (
                      <span key={tag} className="hover:text-[#ff3155] cursor-pointer">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="pt-3 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{isBn ? 'মতামত ও মন্তব্য' : 'Comments'}</span>
                  <span className="text-xs font-normal text-[#a5adbd]">({comments.length})</span>
                </h3>

                {/* Add comment input */}
                <form onSubmit={handleAddComment} className="space-y-2 bg-[#151925] p-3 rounded-xl border border-[#242a39]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCommentName}
                      onChange={(e) => setNewCommentName(e.target.value)}
                      placeholder={isBn ? 'আপনার নাম (ঐচ্ছিক)' : 'Your Name (Optional)'}
                      className="w-1/3 px-3 py-1.5 rounded-lg bg-[#1b2030] border border-[#2d3345] text-xs text-white placeholder-[#788194] focus:outline-none focus:border-[#ff3155]"
                    />
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder={isBn ? 'আপনার মন্তব্য লিখুন...' : 'Write a comment...'}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#1b2030] border border-[#2d3345] text-xs text-white placeholder-[#788194] focus:outline-none focus:border-[#ff3155]"
                    />
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="px-3.5 py-1.5 bg-[#ff3155] hover:bg-[#e62245] disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isBn ? 'পাঠান' : 'Post'}</span>
                    </button>
                  </div>
                </form>

                {/* Comment list */}
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3 text-xs">
                      <div className="w-8 h-8 rounded-full bg-[#242a39] flex items-center justify-center font-bold text-white shrink-0">
                        {c.avatarText}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{c.author}</span>
                          <span className="text-[11px] text-[#8790a3]">{c.timestamp}</span>
                        </div>
                        <p className="text-[#c4c9d5] leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RELATED VIDEOS BELOW PLAYER (Requirement 2 & 3) */}
              <div className="pt-6 border-t border-[#202535] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#ff3155]" />
                    <span>{isBn ? 'সম্পর্কিত অন্যান্য ভিডিও' : 'Related Videos'}</span>
                  </h3>
                  <span className="text-xs text-[#8e98ac]">
                    {relatedVideos.length} {isBn ? 'টি ভিডিও' : 'videos'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {relatedVideos.map((item) => {
                    const itemTitle = isBn ? item.title : (item.titleEn || item.title);
                    return (
                      <div
                        key={`rel_bottom_${item.id}`}
                        onClick={() => onSelectVideo(item)}
                        className="group bg-[#151925] border border-[#212738] hover:border-[#ff3155] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col justify-between"
                      >
                        <div className="relative aspect-video bg-[#1a2030] overflow-hidden">
                          <img
                            src={item.thumbnail}
                            alt={itemTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {/* Play Icon on each thumbnail (Requirement 3) */}
                          <div className="absolute inset-0 bg-black/35 group-hover:bg-black/15 flex items-center justify-center transition-colors">
                            <div className="w-9 h-9 rounded-full bg-[#ff3155]/95 group-hover:scale-110 flex items-center justify-center text-white shadow-lg transition-transform">
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-[10px] text-white font-medium rounded">
                            {item.duration}
                          </span>
                        </div>
                        <div className="p-2.5">
                          <h4 className="text-xs font-bold text-white group-hover:text-[#ff3155] line-clamp-2 leading-snug">
                            {itemTitle}
                          </h4>
                          <p className="text-[11px] text-[#8e98ac] mt-1 truncate">
                            {item.channelName} • {item.views}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Up Next Sidebar (Right Column) */}
          <div className="lg:col-span-4 p-4 md:p-6 bg-[#0c0e17] space-y-3">
            {/* Render Sidebar Advertisements */}
            {sidebarAds.length > 0 && (
              <div className="space-y-3 pb-2">
                {sidebarAds.map((ad) => (
                  <SandboxedAd key={ad.id} ad={ad} showLabel={true} />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#ff3155]" />
                <span>{isBn ? 'পরবর্তী প্রস্তাবিত ভিডিও' : 'Up Next'}</span>
              </h3>
            </div>

            <div className="space-y-3">
              {relatedVideos.map((item) => {
                const itemTitle = isBn ? item.title : (item.titleEn || item.title);
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectVideo(item)}
                    className="flex gap-3 p-2 rounded-xl hover:bg-[#151925] transition-colors cursor-pointer group border border-transparent hover:border-[#242a39]"
                  >
                    <div className="relative w-32 aspect-video rounded-lg overflow-hidden shrink-0 bg-[#1b2030]">
                      <img
                        src={item.thumbnail}
                        alt={itemTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Play Icon on each thumbnail (Requirement 3) */}
                      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                        <div className="w-7 h-7 rounded-full bg-[#ff3155]/90 flex items-center justify-center text-white shadow">
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-[10px] text-white rounded">
                        {item.duration}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-white group-hover:text-[#ff3155] line-clamp-2 leading-tight">
                        {itemTitle}
                      </h4>
                      <p className="text-[11px] text-[#a5adbd] mt-1 truncate">
                        {item.channelName}
                      </p>
                      <p className="text-[10px] text-[#8790a3]">
                        {item.views}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
