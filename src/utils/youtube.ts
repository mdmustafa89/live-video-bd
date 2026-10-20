/**
 * YouTube Utility Functions for Validation, ID Extraction,
 * Thumbnail Retrieval, and Official Privacy-Enhanced Embed URLs.
 */

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();

  // Direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }

  // Regex for YouTube URLs: standard watch, short URL, shorts, embed, nocookie
  const regExp =
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i;
  const match = clean.match(regExp);
  return match ? match[1] : null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

export function getYouTubeThumbnailUrl(
  idOrUrl: string,
  quality: 'max' | 'hq' | 'mq' = 'hq'
): string {
  const videoId = extractYouTubeId(idOrUrl) || idOrUrl;
  if (!videoId || videoId.length !== 11) {
    return '/src/assets/images/hero_stream_cinema_1792327536011.jpg';
  }
  if (quality === 'max') {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  if (quality === 'mq') {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Returns the official privacy-enhanced YouTube embed URL (youtube-nocookie.com)
 * with supported parameters. Autoplay is false by default per Requirement 2.
 */
export function getYouTubeEmbedUrl(
  idOrUrl: string,
  options?: { autoplay?: boolean; enablejsapi?: boolean }
): string {
  const videoId = extractYouTubeId(idOrUrl) || idOrUrl;
  const autoplayParam = options?.autoplay ? 1 : 0;
  const jsapiParam = options?.enablejsapi !== false ? 1 : 0;

  // Uses youtube-nocookie.com for privacy-enhanced mode
  // rel=0 limits recommendations to the same channel
  // modestbranding=1 minimizes player chrome
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplayParam}&rel=0&modestbranding=1&enablejsapi=${jsapiParam}`;
}

/**
 * Fetches YouTube video metadata via public oEmbed or server endpoint
 */
export async function fetchYouTubeMetadata(
  urlOrId: string
): Promise<{ title?: string; authorName?: string; thumbnail: string; videoId: string } | null> {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) return null;

  const defaultThumbnail = getYouTubeThumbnailUrl(videoId, 'hq');

  try {
    // 1. Try our server proxy first
    const res = await fetch(`/api/youtube/info?url=${encodeURIComponent(urlOrId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          title: data.title,
          authorName: data.authorName,
          thumbnail: data.thumbnail || defaultThumbnail,
          videoId,
        };
      }
    }
  } catch (err) {
    console.warn('Server YouTube proxy failed, falling back to direct oEmbed:', err);
  }

  try {
    // 2. Direct oEmbed fallback
    const oembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const directRes = await fetch(oembedUrl);
    if (directRes.ok) {
      const json = await directRes.json();
      return {
        title: json.title,
        authorName: json.author_name,
        thumbnail: defaultThumbnail,
        videoId,
      };
    }
  } catch {
    // Fallback to basic info
  }

  return {
    thumbnail: defaultThumbnail,
    videoId,
  };
}
