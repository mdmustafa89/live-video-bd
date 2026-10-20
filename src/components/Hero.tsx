import React from 'react';
import { Play, Radio, Users, Sparkles } from 'lucide-react';
import { VideoItem, Language } from '../types/video';

interface HeroProps {
  featuredVideo: VideoItem;
  onPlayVideo: (video: VideoItem) => void;
  lang: Language;
}

export const Hero: React.FC<HeroProps> = ({ featuredVideo, onPlayVideo, lang }) => {
  const isBn = lang === 'bn';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#21142d] via-[#101827] to-[#17101d] border-b border-[#252938]">
      {/* Background glow overlay */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#ff3155]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#3b2a54]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Heading and Value Proposition */}
          <div className="lg:col-span-7 space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff3155]/15 border border-[#ff3155]/30 text-[#ff3155] text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBn ? 'প্রিমিয়াম বাংলা ও বৈশ্বিক বিনোদন' : 'Premium Bengali & Global Streaming'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight text-balance">
              {isBn ? (
                <>
                  আপনার পছন্দের <span className="text-[#ff3155]">ভিডিও</span>
                </>
              ) : (
                <>
                  Watch Your Favorite <span className="text-[#ff3155]">Videos</span>
                </>
              )}
            </h1>

            <p className="text-[#c4c9d5] text-base md:text-lg leading-relaxed max-w-xl">
              {isBn
                ? 'নতুন ভিডিও আবিষ্কার করুন, পছন্দের কনটেন্ট খুঁজুন এবং নিরবচ্ছিন্ন এইচডি কোয়ালিটিতে লাইভ সম্প্রচার উপভোগ করুন।'
                : 'Discover trending videos, search your favorite content, and enjoy seamless high-definition live broadcasts.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onPlayVideo(featuredVideo)}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#ff3155] hover:bg-[#e62245] text-white font-bold rounded-xl shadow-lg shadow-[#ff3155]/30 transition-all hover:translate-y-[-2px] active:translate-y-0"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{isBn ? 'ফিচার্ড লাইভ দেখুন' : 'Watch Featured Stream'}</span>
              </button>

              <div className="flex items-center gap-2 text-xs md:text-sm text-[#a5adbd]">
                <span className="w-2 h-2 rounded-full bg-[#ff3155] animate-ping" />
                <span className="font-medium text-white">
                  {featuredVideo.liveViewers || '১২,৪৫০'}
                </span>
                <span>{isBn ? 'জন সরাসরি যুক্ত আছেন' : 'watching right now'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Spotlight Card */}
          <div className="lg:col-span-5">
            <div
              onClick={() => onPlayVideo(featuredVideo)}
              className="group relative rounded-2xl overflow-hidden bg-[#151925] border border-[#2b3144] hover:border-[#ff3155] transition-all duration-300 shadow-2xl cursor-pointer"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-[#192c3b]">
                <img
                  src={featuredVideo.thumbnail}
                  alt={isBn ? featuredVideo.title : (featuredVideo.titleEn || featuredVideo.title)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090b12] via-[#090b12]/30 to-transparent" />

                {/* Live Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ff3155] text-white text-xs font-bold tracking-wider shadow-md">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>{isBn ? 'সরাসরি লাইভ' : 'LIVE NOW'}</span>
                </div>

                {/* Viewers */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white/90 text-xs font-medium">
                  <Users className="w-3 h-3 text-[#ff3155]" />
                  <span>{featuredVideo.liveViewers || '12K'}</span>
                </div>

                {/* Center Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#ff3155]/90 group-hover:bg-[#ff3155] group-hover:scale-110 text-white flex items-center justify-center shadow-xl shadow-[#ff3155]/40 transition-all duration-300">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-5">
                <span className="text-xs font-semibold text-[#ff3155] uppercase tracking-wider">
                  {isBn ? featuredVideo.category : featuredVideo.categoryEn}
                </span>
                <h3 className="text-base md:text-lg font-bold text-white group-hover:text-[#ff3155] transition-colors line-clamp-2 mt-1">
                  {isBn ? featuredVideo.title : (featuredVideo.titleEn || featuredVideo.title)}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[#a5adbd] mt-2">
                  <span>{featuredVideo.channelName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{isBn ? featuredVideo.uploadedAt : 'Broadcasting Live'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
