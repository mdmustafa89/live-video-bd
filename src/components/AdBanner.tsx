import React, { useState } from 'react';
import { Megaphone, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { Language } from '../types/video';

interface AdBannerProps {
  lang: Language;
}

export const AdBanner: React.FC<AdBannerProps> = ({ lang }) => {
  const [dismissed, setDismissed] = useState(false);
  const [showDemoSponsor, setShowDemoSponsor] = useState(false);
  const isBn = lang === 'bn';

  if (dismissed) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 my-6">
      <div className="relative rounded-xl border border-dashed border-[#454b5b] bg-[#121624] p-4 text-center transition-all">
        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2.5 right-2.5 p-1 text-[#8f98aa] hover:text-white rounded-md transition-colors"
          title={isBn ? 'বিজ্ঞাপন লুকান' : 'Dismiss Ad Space'}
          aria-label="Dismiss ad"
        >
          <X className="w-4 h-4" />
        </button>

        {!showDemoSponsor ? (
          <div className="space-y-1.5 py-1">
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#ff3155] font-semibold">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Advertisement Space</span>
            </div>
            <p className="text-sm text-[#8f98aa]">
              {isBn
                ? 'এখানে অনুমোদিত বিজ্ঞাপন নেটওয়ার্কের (AdSense / Sponsor Banner) কোড বসানো যাবে।'
                : 'Authorized advertising network script or sponsor banner goes here.'}
            </p>
            <div className="pt-1">
              <button
                onClick={() => setShowDemoSponsor(true)}
                className="text-xs text-[#c4c9d5] hover:text-white underline underline-offset-4 decoration-[#ff3155]"
              >
                {isBn ? 'স্পন্সর প্রিভিউ প্রদর্শন করুন' : 'Preview Sponsor Banner'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 text-left bg-gradient-to-r from-[#1c2234] to-[#161a29] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ff3155]/20 flex items-center justify-center text-[#ff3155] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-[#ff3155]">
                  {isBn ? 'বিজ্ঞাপন পার্টনার' : 'Sponsored Partner'}
                </span>
                <h4 className="text-sm font-bold text-white">
                  {isBn ? 'হাই-স্পিড অপটিক্যাল ফাইবার ইন্টারনেট' : 'Gigabit Fiber Broadband'}
                </h4>
                <p className="text-xs text-[#a5adbd]">
                  {isBn ? 'নিরবচ্ছিন্ন 4K বাফারহীন লাইভ ভিডিও স্ট্রিমিং অভিজ্ঞতা পান।' : 'Enjoy zero-buffer 4K ultra HD live video streaming.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => setShowDemoSponsor(false)}
                className="px-3 py-1.5 text-xs text-[#8f98aa] hover:text-white"
              >
                {isBn ? 'কোড স্লটে ফেরত' : 'Back to slot'}
              </button>
              <a
                href="#speedtest"
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#ff3155] hover:bg-[#e62245] text-white text-xs font-semibold transition-colors"
              >
                <span>{isBn ? 'বিস্তারিত জানুন' : 'Learn More'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
