import React from 'react';
import { Tv, Heart, Shield, Film, Radio } from 'lucide-react';
import { Language } from '../types/video';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const isBn = lang === 'bn';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-[#10131d] border-t border-[#252938] text-[#a5adbd] text-xs md:text-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#ff3155] flex items-center justify-center text-white">
                <Tv className="w-4 h-4" />
              </div>
              <strong className="text-xl font-black text-white tracking-tight">
                LIVE <span className="text-[#ff3155]">VIDEO</span>
              </strong>
            </div>

            <p className="text-[#c4c9d5] max-w-sm leading-relaxed">
              {isBn
                ? 'আপনার পছন্দের ভিডিও এক জায়গায়। লাইভ স্ট্রিমিং, নাটক, বাংলা গান এবং তথ্যচিত্রের সেরা প্ল্যাটফর্ম।'
                : 'Your favorite videos in one place. The premier platform for live streaming, dramas, Bengali music, and documentaries.'}
            </p>

            <div className="flex items-center gap-4 pt-1 text-xs text-[#8f98aa]">
              <span className="flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-[#ff3155]" />
                {isBn ? 'এইচডি সরাসরি সম্প্রচার' : 'HD Live Broadcast'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-[#ff3155]" />
                {isBn ? 'দ্রুত বাফার-ফ্রি স্ট্রিমিং' : 'Buffer-Free Streaming'}
              </span>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-2.5">
            <h4 className="text-xs uppercase tracking-wider font-bold text-white">
              {isBn ? 'জনপ্রিয় ক্যাটাগরি' : 'Popular Categories'}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  {isBn ? 'বাংলা নাটক ও টেলিফিল্ম' : 'Bangla Natok & Telefilms'}
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  {isBn ? 'লাইভ কনসার্ট ও সঙ্গীত' : 'Live Concerts & Folk Music'}
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  {isBn ? 'প্রযুক্তি ও গ্যাজেট রিভিউ' : 'Tech & Gadgets Review'}
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  {isBn ? 'সুন্দরবন ও প্রকৃতি ডকুমেন্টারি' : 'Nature & Wildlife Documentaries'}
                </span>
              </li>
            </ul>
          </div>

          {/* Legal and Support */}
          <div className="space-y-2.5">
            <h4 className="text-xs uppercase tracking-wider font-bold text-white">
              {isBn ? 'তথ্য ও নিয়মাবলী' : 'Info & Policies'}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  {isBn ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  {isBn ? 'ব্যবহারের শর্তাবলী (Terms)' : 'Terms of Service'}
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  {isBn ? 'কপিরাইট ও ডিএমসিএ (DMCA)' : 'Copyright & DMCA'}
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  {isBn ? 'যোগাযোগ ও সাপোর্ট' : 'Contact & Support'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 border-t border-[#252938] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>
            © {currentYear} <strong className="text-white">Live Video</strong>. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-[#8f98aa]">
            <span>{isBn ? 'নির্মিত হয়েছে' : 'Crafted with'}</span>
            <Heart className="w-3.5 h-3.5 text-[#ff3155] fill-[#ff3155]" />
            <span>{isBn ? 'বাংলা ভিডিও দর্শকদের জন্য' : 'for video lovers'}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
