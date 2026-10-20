import React, { useEffect, useRef, useState } from 'react';
import { Advertisement } from '../types/ad';

interface SandboxedAdProps {
  ad: Advertisement;
  className?: string;
  showLabel?: boolean;
}

export const SandboxedAd: React.FC<SandboxedAdProps> = ({
  ad,
  className = '',
  showLabel = true,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(100);

  // Construct isolated HTML page with responsive viewport and theme styles
  const iframeContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: transparent;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
    img, video, iframe { max-width: 100%; height: auto; }
    a { color: inherit; }
  </style>
</head>
<body>
  <div id="ad-root" style="width: 100%; display: flex; justify-content: center;">
    ${ad.code}
  </div>

  <script>
    function updateHeight() {
      var root = document.getElementById('ad-root');
      var height = root ? root.scrollHeight : document.body.scrollHeight;
      if (height > 0) {
        window.parent.postMessage({ type: 'AD_HEIGHT_UPDATE', id: '${ad.id}', height: height }, '*');
      }
    }
    window.addEventListener('load', updateHeight);
    window.addEventListener('resize', updateHeight);
    setTimeout(updateHeight, 300);
    setTimeout(updateHeight, 1000);
  </script>
</body>
</html>
  `;

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'AD_HEIGHT_UPDATE' && e.data.id === ad.id) {
        const h = Math.max(50, Math.min(e.data.height + 6, 600));
        setIframeHeight(h);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [ad.id]);

  if (!ad.enabled) return null;

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden bg-[#101420]/80 border border-[#22293c] transition-all my-3 ${className}`}
      data-ad-network={ad.networkName}
      data-ad-position={ad.position}
    >
      {showLabel && (
        <div className="flex items-center justify-between px-3 py-1 bg-[#131826] border-b border-[#1f2638] text-[10px] text-[#7d879e]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff3155]" />
            <span className="font-semibold uppercase tracking-wider text-[#ff3155]">
              বিজ্ঞাপন / AD
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#a5adbd] font-medium">{ad.networkName}</span>
          </div>
          <span className="text-[10px] text-[#69738a] hidden sm:inline truncate max-w-[200px]">
            {ad.placementName}
          </span>
        </div>
      )}

      {/* Sandboxed iframe protects host application DOM while executing ad code cleanly */}
      <div className="p-2 md:p-3 flex items-center justify-center min-h-[60px]">
        <iframe
          ref={iframeRef}
          srcDoc={iframeContent}
          title={`Ad - ${ad.placementName}`}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          scrolling="no"
          style={{ height: `${iframeHeight}px`, width: '100%', border: 'none' }}
          className="transition-all duration-300"
        />
      </div>
    </div>
  );
};
