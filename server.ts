import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const ADS_FILE = path.join(DATA_DIR, 'ads.json');
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Body parser up to 100MB for video and thumbnail upload handling
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Serve static uploads (uploaded videos and thumbnails)
app.use('/uploads', express.static(UPLOADS_DIR));

// --- PASSWORD HASHING UTILITIES (Requirement 7) ---
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const computed = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

// Initial Administrator initialization (Requirement 2 & 3: Password Ssmmaa1)
function getOrInitAdmin() {
  if (!fs.existsSync(ADMIN_FILE)) {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword('Ssmmaa1', salt);
    const adminRecord = {
      username: 'admin',
      email: 'admin@livevideo.internal',
      salt,
      passwordHash,
      mustChangePassword: true, // Forces immediate password change upon first login
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(adminRecord, null, 2), 'utf-8');
    return adminRecord;
  }
  try {
    return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading admin.json:', err);
    return null;
  }
}

getOrInitAdmin();

// --- SESSIONS MANAGEMENT ---
interface SessionData {
  token: string;
  username: string;
  mustChangePassword: boolean;
  createdAt: number;
}

function readSessions(): Record<string, SessionData> {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return {};
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeSessions(sessions: Record<string, SessionData>) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing sessions:', err);
  }
}

function getSession(token: string): SessionData | null {
  const sessions = readSessions();
  const session = sessions[token];
  if (!session) return null;
  // 7-day expiration
  if (Date.now() - session.createdAt > 7 * 24 * 60 * 60 * 1000) {
    delete sessions[token];
    writeSessions(sessions);
    return null;
  }
  return session;
}

// Admin Authorization Middleware (Requirement 8)
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Administrator authentication token required.',
      requireLogin: true,
    });
  }

  const token = authHeader.split(' ')[1];
  const session = getSession(token);

  if (!session) {
    return res.status(401).json({
      error: 'Unauthorized: Session invalid or expired. Please login again.',
      requireLogin: true,
    });
  }

  const isExemptRoute =
    req.path === '/api/admin/change-password' ||
    req.path === '/api/admin/me' ||
    req.path === '/api/admin/logout';

  if (session.mustChangePassword && !isExemptRoute) {
    return res.status(403).json({
      error: 'Security Policy: Initial password change required before accessing administrative functions.',
      mustChangePassword: true,
    });
  }

  (req as any).adminSession = session;
  next();
}

// --- DATA ACCESS HELPERS ---
function readAds(): any[] {
  try {
    if (!fs.existsSync(ADS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ADS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeAds(ads: any[]): boolean {
  try {
    fs.writeFileSync(ADS_FILE, JSON.stringify(ads, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function readVideos(): any[] {
  try {
    if (!fs.existsSync(VIDEOS_FILE)) return [];
    return JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeVideos(videos: any[]): boolean {
  try {
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function readCategories(): any[] {
  try {
    if (!fs.existsSync(CATEGORIES_FILE)) return [];
    return JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeCategories(categories: any[]): boolean {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

// =========================================================================
// FILE UPLOAD ENDPOINT (Admin Only - Supports Mobile & Desktop Uploads)
// =========================================================================
app.post('/api/upload', requireAdmin, (req: Request, res: Response) => {
  const { filename, data, type } = req.body;

  if (!filename || !data) {
    return res.status(400).json({ error: 'Filename and file data are required.' });
  }

  try {
    const base64Data = data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = path.extname(filename) || (type === 'image' ? '.jpg' : '.mp4');
    const safeBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${Date.now()}_${safeBase}${ext}`;
    const destination = path.join(UPLOADS_DIR, uniqueFilename);

    fs.writeFileSync(destination, buffer);

    const publicUrl = `/uploads/${uniqueFilename}`;
    res.json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
      sizeBytes: buffer.length,
      formattedSize: `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`,
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to process and store uploaded file.' });
  }
});

// =========================================================================
// YOUTUBE VIDEO HELPERS & ENDPOINTS (Requirement 1 & 5)
// =========================================================================
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const clean = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  const match = clean.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

// GET /api/youtube/info : extract ID and fetch oEmbed metadata
app.get('/api/youtube/info', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ success: false, error: 'YouTube URL is required.' });
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return res.status(400).json({
      success: false,
      error: 'সঠিক ইউটিউব ভিডিও লিংক প্রদান করুন। (Invalid YouTube Video URL)',
    });
  }

  const standardThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const maxresThumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = (await response.json()) as any;
      return res.json({
        success: true,
        videoId,
        title: data.title || '',
        authorName: data.author_name || 'YouTube Creator',
        thumbnail: standardThumb,
        maxresThumbnail: maxresThumb,
        embedUrl,
      });
    }
  } catch (err) {
    console.warn('YouTube oEmbed fetch error:', err);
  }

  // Fallback if oEmbed is unreachable
  return res.json({
    success: true,
    videoId,
    title: '',
    authorName: 'YouTube Creator',
    thumbnail: standardThumb,
    maxresThumbnail: maxresThumb,
    embedUrl,
  });
});

// =========================================================================
// PUBLIC ROUTES (Requirement 6: Public visitors watch videos without login)
// =========================================================================

// GET /api/videos : returns only published videos for visitors
app.get('/api/videos', (_req: Request, res: Response) => {
  const videos = readVideos();
  // Filter published videos (default to true if undefined)
  const published = videos.filter((v) => v.published !== false);
  res.json({ success: true, count: published.length, data: published });
});

// GET /api/categories : public categories list with live video counts
app.get('/api/categories', (_req: Request, res: Response) => {
  const categories = readCategories();
  const videos = readVideos();
  const publishedVideos = videos.filter((v) => v.published !== false);

  const enriched = categories.map((cat) => ({
    ...cat,
    videoCount: publishedVideos.filter((v) => v.category === cat.id).length,
  }));

  res.json({ success: true, count: enriched.length, data: enriched });
});

// GET /api/tags : aggregate all tags across published videos
app.get('/api/tags', (_req: Request, res: Response) => {
  const videos = readVideos();
  const publishedVideos = videos.filter((v) => v.published !== false);
  const tagCounts: Record<string, number> = {};

  publishedVideos.forEach((v) => {
    if (Array.isArray(v.tags)) {
      v.tags.forEach((t: string) => {
        const clean = t.trim();
        if (clean) tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      });
    }
  });

  const tagsList = Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }));
  tagsList.sort((a, b) => b.count - a.count);

  res.json({ success: true, data: tagsList });
});

// GET /api/ads : returns enabled advertisements for visitors
app.get('/api/ads', (_req: Request, res: Response) => {
  const ads = readAds();
  const enabledAds = ads.filter((ad) => ad.enabled);
  res.json({ success: true, count: enabledAds.length, data: enabledAds });
});

// GET /api/database/status
app.get('/api/database/status', (_req: Request, res: Response) => {
  const admin = getOrInitAdmin();
  const hasCloudSql = !!process.env.DATABASE_URL;
  const hasFirebase = !!process.env.FIREBASE_CONFIG;
  const videos = readVideos();
  const ads = readAds();
  const categories = readCategories();

  res.json({
    success: true,
    data: {
      isConfigured: true,
      authStatus: {
        method: 'PBKDF2-SHA512 (100,000 iterations + 128-bit Cryptographic Salt)',
        adminConfigured: Boolean(admin),
        mustChangePassword: admin?.mustChangePassword ?? false,
        plaintextStored: false,
      },
      stats: {
        totalVideos: videos.length,
        publishedVideos: videos.filter((v) => v.published !== false).length,
        totalAds: ads.length,
        totalCategories: categories.length,
      },
      storagePaths: {
        admin: ADMIN_FILE,
        videos: VIDEOS_FILE,
        categories: CATEGORIES_FILE,
        ads: ADS_FILE,
        uploads: UPLOADS_DIR,
      },
      type: hasCloudSql ? 'cloud_sql' : hasFirebase ? 'firestore' : 'local_json',
      label: hasCloudSql
        ? 'Cloud SQL (PostgreSQL)'
        : hasFirebase
        ? 'Firebase Firestore'
        : 'Node.js Server Storage (JSON Database + Uploads Directory)',
      cloudDatabaseConfigured: hasCloudSql || hasFirebase,
      description:
        'All administrator credentials, videos, thumbnails, categories, tags, and advertisements are managed by the server backend. Passwords use PBKDF2-SHA512 hashing.',
      recommendation:
        'For distributed cloud deployments with multiple containers, provision Cloud SQL via DATABASE_URL or Firebase Firestore.',
    },
  });
});

// =========================================================================
// AUTHENTICATION ROUTES (Admin Login & Password Change)
// =========================================================================

// POST /api/admin/login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const admin = getOrInitAdmin();
  if (!admin) {
    return res.status(500).json({ success: false, error: 'Administrator record unavailable.' });
  }

  const isValidUser = username.trim().toLowerCase() === admin.username.toLowerCase();
  const isValidPass = isValidUser && verifyPassword(password, admin.salt, admin.passwordHash);

  if (!isValidPass) {
    return res.status(401).json({
      success: false,
      error: 'ভুল ইউজারনেম বা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় চেষ্টা করুন। (Invalid username or password)',
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const sessions = readSessions();
  sessions[token] = {
    token,
    username: admin.username,
    mustChangePassword: admin.mustChangePassword,
    createdAt: Date.now(),
  };
  writeSessions(sessions);

  res.json({
    success: true,
    token,
    username: admin.username,
    mustChangePassword: admin.mustChangePassword,
    message: admin.mustChangePassword
      ? 'Login successful. You must change your initial password before continuing.'
      : 'Administrator authenticated successfully.',
  });
});

// POST /api/admin/change-password
app.post('/api/admin/change-password', requireAdmin, (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const session = (req as any).adminSession as SessionData;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ success: false, error: 'সবগুলো ফিল্ড পূরণ করা আবশ্যক।' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({
      success: false,
      error: 'নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।',
    });
  }

  const admin = getOrInitAdmin();
  if (!admin) return res.status(500).json({ success: false, error: 'Admin record not found.' });

  if (!verifyPassword(currentPassword, admin.salt, admin.passwordHash)) {
    return res.status(400).json({ success: false, error: 'বর্তমান পাসওয়ার্ডটি ভুল।' });
  }

  if (verifyPassword(newPassword, admin.salt, admin.passwordHash)) {
    return res.status(400).json({
      success: false,
      error: 'নতুন পাসওয়ার্ডটি বর্তমান পাসওয়ার্ড থেকে ভিন্ন হতে হবে।',
    });
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newPasswordHash = hashPassword(newPassword, newSalt);

  const updatedAdmin = {
    ...admin,
    salt: newSalt,
    passwordHash: newPasswordHash,
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(ADMIN_FILE, JSON.stringify(updatedAdmin, null, 2), 'utf-8');

  const sessions = readSessions();
  if (sessions[session.token]) {
    sessions[session.token].mustChangePassword = false;
    writeSessions(sessions);
  }

  res.json({
    success: true,
    mustChangePassword: false,
    message: 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! পুরাতন পাসওয়ার্ড আর কাজ করবে না।',
  });
});

// GET /api/admin/me
app.get('/api/admin/me', requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession as SessionData;
  const admin = getOrInitAdmin();

  res.json({
    authenticated: true,
    username: session.username,
    mustChangePassword: admin?.mustChangePassword ?? false,
  });
});

// POST /api/admin/logout
app.post('/api/admin/logout', requireAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession as SessionData;
  const sessions = readSessions();
  delete sessions[session.token];
  writeSessions(sessions);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// =========================================================================
// DASHBOARD STATS & KPI OVERVIEW (Requirement 5)
// =========================================================================
app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const videos = readVideos();
  const ads = readAds();
  const categories = readCategories();

  const publishedVideos = videos.filter((v) => v.published !== false).length;
  const unpublishedVideos = videos.length - publishedVideos;
  const activeAds = ads.filter((a) => a.enabled).length;

  const tagSet = new Set<string>();
  videos.forEach((v) => {
    if (Array.isArray(v.tags)) v.tags.forEach((t: string) => tagSet.add(t.trim()));
  });

  res.json({
    success: true,
    data: {
      totalVideos: videos.length,
      publishedVideos,
      unpublishedVideos,
      totalCategories: categories.length,
      totalAds: ads.length,
      activeAds,
      totalTags: tagSet.size,
    },
  });
});

// =========================================================================
// VIDEO MANAGEMENT ROUTES (Requirement 1: Upload, Edit, Delete, Publish/Unpublish)
// =========================================================================

// GET /api/admin/videos : returns all videos including drafts/unpublished
app.get('/api/admin/videos', requireAdmin, (_req: Request, res: Response) => {
  const videos = readVideos();
  res.json({ success: true, count: videos.length, data: videos });
});

// POST /api/admin/videos : upload/create new video
app.post('/api/admin/videos', requireAdmin, (req: Request, res: Response) => {
  const {
    title,
    titleEn,
    channelName,
    category,
    categoryEn,
    duration,
    thumbnail,
    videoUrl,
    description,
    tags,
    isLive,
    published,
    fileSize,
    isUploadedFile,
  } = req.body;

  if (!title || !videoUrl) {
    return res.status(400).json({ error: 'Title and Video URL or upload are required.' });
  }

  const rawUrl = String(videoUrl).trim();
  const ytId = extractYouTubeId(rawUrl);
  const isYouTube = Boolean(ytId || req.body.sourceType === 'youtube' || rawUrl.includes('youtu'));

  if (isYouTube && !ytId) {
    return res.status(400).json({
      error: 'সঠিক ইউটিউব ভিডিও লিংক প্রদান করুন। (Invalid YouTube Video URL)',
    });
  }

  const effectiveThumbnail =
    thumbnail && thumbnail.trim()
      ? thumbnail.trim()
      : ytId
      ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
      : '/src/assets/images/hero_stream_cinema_1792327536011.jpg';

  const videos = readVideos();
  const newVideo = {
    id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: String(title).trim(),
    titleEn: titleEn ? String(titleEn).trim() : undefined,
    channelName: channelName ? String(channelName).trim() : 'Live Video Creator',
    category: category || 'নাটক',
    categoryEn: categoryEn || 'Drama',
    views: '০ ভিউ',
    uploadedAt: 'এইমাত্র',
    duration: duration || (ytId ? 'YouTube' : '১০:০০'),
    thumbnail: effectiveThumbnail,
    videoUrl: rawUrl,
    youtubeId: ytId || undefined,
    sourceType: ytId ? 'youtube' : isUploadedFile ? 'upload' : 'url',
    isLive: Boolean(isLive),
    published: published !== undefined ? Boolean(published) : true,
    fileSize: fileSize || undefined,
    isUploadedFile: Boolean(isUploadedFile),
    description: description ? String(description).trim() : '',
    tags: Array.isArray(tags) ? tags.map((t: string) => String(t).trim()).filter(Boolean) : ['Video'],
    likes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  videos.unshift(newVideo);
  if (!writeVideos(videos)) {
    return res.status(500).json({ error: 'Failed to save video to database.' });
  }

  res.status(201).json({ success: true, data: newVideo });
});

// PUT /api/admin/videos/:id : edit video
app.put('/api/admin/videos/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const videos = readVideos();
  const index = videos.findIndex((v) => v.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  const existing = videos[index];
  const rawUrl = req.body.videoUrl !== undefined ? String(req.body.videoUrl).trim() : existing.videoUrl;
  const ytId = extractYouTubeId(rawUrl);
  const isYouTube = Boolean(ytId || req.body.sourceType === 'youtube' || rawUrl.includes('youtu'));

  if (isYouTube && !ytId) {
    return res.status(400).json({
      error: 'সঠিক ইউটিউব ভিডিও লিংক প্রদান করুন। (Invalid YouTube Video URL)',
    });
  }

  const updatedThumbnail =
    req.body.thumbnail !== undefined && req.body.thumbnail.trim()
      ? req.body.thumbnail.trim()
      : ytId && (!existing.thumbnail || existing.thumbnail.includes('hero_stream_cinema'))
      ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
      : existing.thumbnail;

  const updated = {
    ...existing,
    ...req.body,
    videoUrl: rawUrl,
    youtubeId: ytId || existing.youtubeId,
    sourceType: ytId ? 'youtube' : req.body.sourceType || existing.sourceType,
    thumbnail: updatedThumbnail,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  videos[index] = updated;
  if (!writeVideos(videos)) {
    return res.status(500).json({ error: 'Failed to update video database.' });
  }

  res.json({ success: true, data: updated });
});

// PATCH /api/admin/videos/:id/publish : toggle publish/unpublish
app.patch('/api/admin/videos/:id/publish', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const videos = readVideos();
  const index = videos.findIndex((v) => v.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  const current = videos[index].published !== false;
  videos[index].published = !current;
  videos[index].updatedAt = new Date().toISOString();

  if (!writeVideos(videos)) {
    return res.status(500).json({ error: 'Failed to update video publish state.' });
  }

  res.json({ success: true, published: videos[index].published, data: videos[index] });
});

// DELETE /api/admin/videos/:id : delete video
app.delete('/api/admin/videos/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const videos = readVideos();
  const filtered = videos.filter((v) => v.id !== id);

  if (filtered.length === videos.length) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  if (!writeVideos(filtered)) {
    return res.status(500).json({ error: 'Failed to delete video.' });
  }

  res.json({ success: true, message: 'Video deleted successfully.' });
});

// =========================================================================
// CATEGORY MANAGEMENT ROUTES (Requirement 2)
// =========================================================================

// POST /api/admin/categories : create category
app.post('/api/admin/categories', requireAdmin, (req: Request, res: Response) => {
  const { id, labelBn, labelEn, icon, description } = req.body;

  if (!labelBn && !labelEn) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  const categoryId = (id || labelBn || labelEn).trim();
  const categories = readCategories();

  if (categories.some((c) => c.id === categoryId)) {
    return res.status(400).json({ error: 'Category with this name or ID already exists.' });
  }

  const newCat = {
    id: categoryId,
    labelBn: labelBn ? labelBn.trim() : labelEn.trim(),
    labelEn: labelEn ? labelEn.trim() : labelBn.trim(),
    icon: icon || 'Film',
    description: description || '',
    createdAt: new Date().toISOString(),
  };

  categories.push(newCat);
  if (!writeCategories(categories)) {
    return res.status(500).json({ error: 'Failed to write category to database.' });
  }

  res.status(201).json({ success: true, data: newCat });
});

// PUT /api/admin/categories/:id : edit category
app.put('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { labelBn, labelEn, icon, description, newId } = req.body;

  const categories = readCategories();
  const index = categories.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Category not found.' });
  }

  const oldCat = categories[index];
  const targetId = newId ? newId.trim() : oldCat.id;

  const updatedCat = {
    ...oldCat,
    id: targetId,
    labelBn: labelBn !== undefined ? labelBn.trim() : oldCat.labelBn,
    labelEn: labelEn !== undefined ? labelEn.trim() : oldCat.labelEn,
    icon: icon !== undefined ? icon : oldCat.icon,
    description: description !== undefined ? description : oldCat.description,
    updatedAt: new Date().toISOString(),
  };

  categories[index] = updatedCat;
  writeCategories(categories);

  // If category ID changed, update all videos that belonged to old ID
  if (targetId !== oldCat.id) {
    const videos = readVideos();
    let updatedCount = 0;
    videos.forEach((v) => {
      if (v.category === oldCat.id) {
        v.category = targetId;
        v.categoryEn = updatedCat.labelEn;
        updatedCount++;
      }
    });
    if (updatedCount > 0) writeVideos(videos);
  }

  res.json({ success: true, data: updatedCat });
});

// DELETE /api/admin/categories/:id : delete category
app.delete('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const categories = readCategories();
  const filtered = categories.filter((c) => c.id !== id);

  if (filtered.length === categories.length) {
    return res.status(404).json({ error: 'Category not found.' });
  }

  if (!writeCategories(filtered)) {
    return res.status(500).json({ error: 'Failed to delete category.' });
  }

  res.json({ success: true, message: 'Category deleted successfully.' });
});

// =========================================================================
// TAG MANAGEMENT ROUTES (Requirement 3)
// =========================================================================

// POST /api/admin/tags/rename : rename a tag across all videos
app.post('/api/admin/tags/rename', requireAdmin, (req: Request, res: Response) => {
  const { oldTag, newTag } = req.body;
  if (!oldTag || !newTag) {
    return res.status(400).json({ error: 'Both oldTag and newTag are required.' });
  }

  const videos = readVideos();
  let count = 0;

  videos.forEach((v) => {
    if (Array.isArray(v.tags)) {
      const idx = v.tags.indexOf(oldTag);
      if (idx !== -1) {
        v.tags[idx] = newTag.trim();
        count++;
      }
    }
  });

  if (count > 0) writeVideos(videos);
  res.json({ success: true, affectedVideos: count });
});

// DELETE /api/admin/tags/:tag : delete tag from all videos
app.delete('/api/admin/tags/:tag', requireAdmin, (req: Request, res: Response) => {
  const { tag } = req.params;
  const videos = readVideos();
  let count = 0;

  videos.forEach((v) => {
    if (Array.isArray(v.tags)) {
      const originalLength = v.tags.length;
      v.tags = v.tags.filter((t: string) => t !== tag);
      if (v.tags.length !== originalLength) count++;
    }
  });

  if (count > 0) writeVideos(videos);
  res.json({ success: true, affectedVideos: count });
});

// =========================================================================
// ADVERTISEMENT ROUTES (Requirement 4)
// =========================================================================

// GET /api/admin/ads
app.get('/api/admin/ads', requireAdmin, (_req: Request, res: Response) => {
  const ads = readAds();
  res.json({ success: true, count: ads.length, data: ads });
});

// POST /api/admin/ads
app.post('/api/admin/ads', requireAdmin, (req: Request, res: Response) => {
  const { networkName, placementName, code, position, enabled } = req.body;

  if (!networkName || !placementName || !code || !position) {
    return res.status(400).json({
      error: 'Missing required fields: networkName, placementName, code, and position are mandatory.',
    });
  }

  const allowedPositions = ['Header', 'Homepage', 'Between Videos', 'Sidebar', 'Footer'];
  if (!allowedPositions.includes(position)) {
    return res.status(400).json({
      error: `Invalid position. Allowed positions: ${allowedPositions.join(', ')}`,
    });
  }

  const ads = readAds();
  const now = new Date().toISOString();

  const newAd = {
    id: `ad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    networkName: String(networkName).trim(),
    placementName: String(placementName).trim(),
    code: String(code).trim(),
    position,
    enabled: Boolean(enabled),
    createdAt: now,
    updatedAt: now,
    impressions: 0,
    clicks: 0,
  };

  ads.unshift(newAd);
  if (!writeAds(ads)) {
    return res.status(500).json({ error: 'Failed to write to database.' });
  }

  res.status(201).json({ success: true, data: newAd });
});

// PUT /api/admin/ads/:id
app.put('/api/admin/ads/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { networkName, placementName, code, position, enabled } = req.body;

  const ads = readAds();
  const index = ads.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Advertisement not found.' });
  }

  const existing = ads[index];
  const updatedAd = {
    ...existing,
    networkName: networkName !== undefined ? String(networkName).trim() : existing.networkName,
    placementName: placementName !== undefined ? String(placementName).trim() : existing.placementName,
    code: code !== undefined ? String(code).trim() : existing.code,
    position: position !== undefined ? position : existing.position,
    enabled: enabled !== undefined ? Boolean(enabled) : existing.enabled,
    updatedAt: new Date().toISOString(),
  };

  ads[index] = updatedAd;
  if (!writeAds(ads)) {
    return res.status(500).json({ error: 'Failed to update database.' });
  }

  res.json({ success: true, data: updatedAd });
});

// PATCH /api/admin/ads/:id/toggle
app.patch('/api/admin/ads/:id/toggle', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const ads = readAds();
  const index = ads.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Advertisement not found.' });
  }

  ads[index].enabled = !ads[index].enabled;
  ads[index].updatedAt = new Date().toISOString();

  if (!writeAds(ads)) {
    return res.status(500).json({ error: 'Failed to update database.' });
  }

  res.json({ success: true, data: ads[index] });
});

// DELETE /api/admin/ads/:id
app.delete('/api/admin/ads/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const ads = readAds();
  const filtered = ads.filter((a) => a.id !== id);

  if (filtered.length === ads.length) {
    return res.status(404).json({ error: 'Advertisement not found.' });
  }

  if (!writeAds(filtered)) {
    return res.status(500).json({ error: 'Failed to delete from database.' });
  }

  res.json({ success: true, message: 'Advertisement deleted successfully.' });
});

// =========================================================================
// VITE / STATIC SERVING
// =========================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Live Video Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
