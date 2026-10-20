import React, { useState } from 'react';
import { Play, Bookmark, Share2, Check, Radio, Edit2, Trash2 } from 'lucide-react';
import { VideoItem, Language } from '../types/video';

interface VideoCardProps {
  video: VideoItem;
  onPlay: (video: VideoItem) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isAdmin?: boolean;
  onEditVideo?: (video: VideoItem) => void;
  onDeleteVideo?: (id: string, title: string) => void;
  lang: Language;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPlay,
  isFavorite,
  onToggleFavorite,
  isAdmin = false,
  onEditVideo,
  onDeleteVideo,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  const isBn = lang === 'bn';

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}?v=${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const title = isBn ? video.title : (video.titleEn || video.title);
  const category = isBn ? video.category : video.categoryEn;

  return (
    <article
      className="group bg-[#151925] rounded-2xl overflow-hidden border border-[#242a39] hover:border-[#ff3155] transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between shadow-lg"
      data-title={title}
    >
      <div>
        {/* Thumbnail Container */}
        <div
          onClick={() => onPlay(video)}
          className="relative aspect-[16/10] bg-gradient-to-br from-[#29223e] to-[#192c3b] overflow-hidden cursor-pointer"
        >
          <img
            src={video.thumbnail}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Scrim Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#151925]/80 via-transparent to-black/20" />

          {/* Central Play Button */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#ff3155]/95 group-hover:bg-[#ff3155] group-hover:scale-110 rounded-full flex items-center justify-center text-white text-lg shadow-lg shadow-black/40 transition-all duration-200">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>

          {/* Duration or Live Indicator */}
          <div className="absolute bottom-2.5 right-2.5">
            {video.isLive ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#ff3155] text-white text-[11px] font-bold rounded">
                <Radio className="w-3 h-3 animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-black/75 backdrop-blur-sm text-white text-[11px] font-medium rounded">
                {video.duration}
              </span>
            )}
          </div>

          {/* Category Tag Top Left */}
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[11px] font-medium text-white/90">
              {category}
            </span>
          </div>

          {/* Top Right Actions: Favorite, Share, and Admin Edit/Delete */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
            {/* Admin-only Edit & Delete shortcuts (Requirement 10) */}
            {isAdmin && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEditVideo) onEditVideo(video);
                  }}
                  className="p-1.5 rounded-full bg-[#1b2030]/90 text-white/90 hover:text-white hover:bg-[#ff3155] transition-all"
                  title={isBn ? 'ভিডিও সম্পাদনা করুন' : 'Edit Video'}
                  aria-label="Edit video"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteVideo) onDeleteVideo(video.id, title);
                  }}
                  className="p-1.5 rounded-full bg-[#1b2030]/90 text-[#ff6882] hover:text-white hover:bg-[#ff3155] transition-all"
                  title={isBn ? 'ভিডিও ডিলিট করুন' : 'Delete Video'}
                  aria-label="Delete video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(video.id);
              }}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                isFavorite
                  ? 'bg-[#ff3155] text-white'
                  : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70'
              }`}
              title={isFavorite ? (isBn ? 'সংরক্ষিত থেকে সরান' : 'Remove from favorites') : (isBn ? 'পছন্দ তালিকায় রাখুন' : 'Save to favorites')}
              aria-label="Toggle bookmark"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/70 transition-all"
              title={isBn ? 'লিংক কপি করুন' : 'Copy link'}
              aria-label="Share video"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Video Info */}
        <div className="p-3.5 md:p-4">
          <h3
            onClick={() => onPlay(video)}
            className="text-[15px] font-bold text-white group-hover:text-[#ff3155] line-clamp-2 leading-snug cursor-pointer transition-colors"
            title={title}
          >
            {title}
          </h3>

          {/* Quiet Unboxed Metadata with Typographic Separator */}
          <div className="flex items-center gap-2 text-xs text-[#a5adbd] mt-2">
            <span className="truncate max-w-[140px] text-white/80 font-medium">
              {video.channelName}
            </span>
            <span aria-hidden="true">·</span>
            <span>{video.views}</span>
            <span aria-hidden="true">·</span>
            <span>{video.uploadedAt}</span>
          </div>
        </div>
      </div>

      {/* Watch Button Container */}
      <div className="px-3.5 pb-3.5 md:px-4 md:pb-4 pt-1">
        <button
          onClick={() => onPlay(video)}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#ff3155] hover:bg-[#e62245] text-white text-xs md:text-sm font-semibold rounded-lg transition-all shadow-md shadow-[#ff3155]/20 active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isBn ? 'ভিডিও দেখুন' : 'Watch Video'}</span>
        </button>
      </div>
    </article>
  );
};
