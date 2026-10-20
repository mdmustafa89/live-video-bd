import { Advertisement } from '../types/ad';

export const INITIAL_ADVERTISEMENTS: Advertisement[] = [
  {
    id: 'ad-header-1',
    networkName: 'Google AdSense',
    placementName: 'Header Leaderboard (728x90 / Responsive)',
    position: 'Header',
    enabled: true,
    createdAt: '2026-10-18T05:00:00.000Z',
    updatedAt: '2026-10-18T05:00:00.000Z',
    code: `<div style="background: linear-gradient(90deg, #181d2f, #232a42); border: 1px solid #363f5c; border-radius: 10px; padding: 12px 18px; text-align: center; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
  <div style="display: flex; align-items: center; gap: 12px;">
    <span style="background: #ff3155; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">Ad • 728x90</span>
    <span style="font-size: 14px; font-weight: 700; color: #ffffff;">Bangladesh High-Speed Fiber Internet — 100Mbps at ৳৭৯৯</span>
  </div>
  <a href="#" onclick="alert('স্পন্সর অফার: দ্রুততম ব্রডব্যান্ড কানেকশন!'); return false;" style="background: #ff3155; color: #fff; text-decoration: none; padding: 6px 14px; font-size: 12px; font-weight: 700; border-radius: 6px;">এখনই সংযোগ নিন</a>
</div>`,
    impressions: 1240,
    clicks: 86,
  },
  {
    id: 'ad-homepage-1',
    networkName: 'Media.net',
    placementName: 'Homepage Mid-Banner Promotion',
    position: 'Homepage',
    enabled: true,
    createdAt: '2026-10-18T05:10:00.000Z',
    updatedAt: '2026-10-18T05:10:00.000Z',
    code: `<div style="background: linear-gradient(135deg, #1a162b, #121929); border: 1px dashed #495475; border-radius: 12px; padding: 16px 20px; color: #c4c9d5; font-family: sans-serif; text-align: center;">
  <div style="font-size: 11px; text-transform: uppercase; color: #ff3155; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px;">Media.net Sponsored Content</div>
  <div style="font-size: 15px; font-weight: 700; color: #ffffff; margin-bottom: 6px;">স্মার্ট গ্যাজেট ও হেডফোন মেগা উৎসব ২০২৬ — ৭০% পর্যন্ত বিশেষ ছাড়!</div>
  <p style="font-size: 12px; color: #9da6b9; margin: 0 0 10px 0;">অনুমোদিত গ্যাজেট ডিল এবং হোম ডেলিভারি অফার।</p>
  <button onclick="alert('অফার কোড: LIVE2026 সক্রিয় করা হয়েছে!');" style="background: #ff3155; border: none; color: #ffffff; padding: 7px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">কুপন কোড দেখুন</button>
</div>`,
    impressions: 890,
    clicks: 42,
  },
  {
    id: 'ad-between-1',
    networkName: 'Custom Sponsor Network',
    placementName: 'In-Feed Native Stream Card',
    position: 'Between Videos',
    enabled: true,
    createdAt: '2026-10-18T05:20:00.000Z',
    updatedAt: '2026-10-18T05:20:00.000Z',
    code: `<div style="background: #141926; border: 1px solid #2b334a; border-radius: 14px; overflow: hidden; padding: 14px; font-family: sans-serif; color: #fff; height: 100%; display: flex; flex-col; justify-content: space-between; box-sizing: border-box;">
  <div>
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
      <span style="background: #252d42; color: #ff3155; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">প্রস্তাবিত বিজ্ঞাপন</span>
      <span style="font-size: 11px; color: #818a9e;">Live Video Partner</span>
    </div>
    <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px; line-height: 1.4;">
      নতুন বাংলা ওটিটি অ্যাপ সাবস্ক্রিপশন — প্রথম মাস ফ্রি!
    </div>
    <p style="font-size: 12px; color: #9ea7bd; line-height: 1.5; margin: 0 0 12px 0;">
      এইচডি সিনেমা, এক্সক্লুসিভ ওয়েব সিরিজ এবং লাইভ স্পোর্টস যেকোনো ডিভাইসে উপভোগ করুন।
    </p>
  </div>
  <a href="#" onclick="alert('ফ্রি ট্রায়াল অ্যাক্টিভেটেড!'); return false;" style="display: block; text-align: center; background: #ff3155; color: #fff; text-decoration: none; padding: 8px 12px; font-size: 12px; font-weight: 700; border-radius: 8px;">ফ্রি ট্রায়াল শুরু করুন</a>
</div>`,
    impressions: 2150,
    clicks: 165,
  },
  {
    id: 'ad-sidebar-1',
    networkName: 'Google AdSense',
    placementName: 'Player Sidebar Square (300x250)',
    position: 'Sidebar',
    enabled: true,
    createdAt: '2026-10-18T05:30:00.000Z',
    updatedAt: '2026-10-18T05:30:00.000Z',
    code: `<div style="background: #121624; border: 1px solid #252d40; border-radius: 10px; padding: 12px; text-align: center; font-family: sans-serif; color: #fff;">
  <span style="font-size: 10px; color: #7f899e; text-transform: uppercase; letter-spacing: 0.5px;">Sponsored Banner</span>
  <h5 style="font-size: 13px; font-weight: 700; margin: 8px 0 4px 0; color: #fff;">লাইভ ফুটবল ও ক্রিকেট স্ট্রিমিং পাস</h5>
  <p style="font-size: 11px; color: #9da7bc; margin: 0 0 10px 0;">HD 60FPS বাফারলেস ব্রডকাস্ট।</p>
  <button onclick="alert('স্পোর্টস পাস অ্যাক্টিভ!');" style="background: #ff3155; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">এখনই সাবস্ক্রাইব করুন</button>
</div>`,
    impressions: 740,
    clicks: 38,
  },
  {
    id: 'ad-footer-1',
    networkName: 'Adsterra',
    placementName: 'Footer Wide Sticky Banner',
    position: 'Footer',
    enabled: true,
    createdAt: '2026-10-18T05:40:00.000Z',
    updatedAt: '2026-10-18T05:40:00.000Z',
    code: `<div style="background: #0f1320; border: 1px solid #22293d; border-radius: 8px; padding: 10px 16px; text-align: center; color: #9aa3b6; font-family: sans-serif; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap;">
  <span style="background: #20273c; color: #ff3155; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 3px; text-transform: uppercase;">Advertisement</span>
  <span style="color: #ffffff; font-weight: 600;">ভিডিও ক্রিয়েটরদের জন্য আল্ট্রা ফাস্ট হোস্টিং ও ক্লাউড সিডিএন সল্যুশন</span>
  <a href="#" onclick="alert('সিডিএন অফার তথ্য লোড হচ্ছে...'); return false;" style="color: #ff3155; font-weight: 700; text-decoration: underline; margin-left: 6px;">বিস্তারিত জানুন →</a>
</div>`,
    impressions: 1580,
    clicks: 94,
  },
];
