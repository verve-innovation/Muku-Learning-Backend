import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware to enforce Admin role
function adminMiddleware(req: AuthRequest, res: Response, next: () => void) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required' });
  }
  next();
}

// Apply auth and admin middleware to all routes in this router
router.use(authMiddleware);
router.use(adminMiddleware);

// ── GET /api/admin/tables (Overview of counts) ────────────────────────────────
router.get('/tables', async (req: AuthRequest, res: Response) => {
  try {
    const [users, categories, words, progress, sessions, badges, userBadges] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.word.count(),
      prisma.progress.count(),
      prisma.lessonSession.count(),
      prisma.badge.count(),
      prisma.userBadge.count(),
    ]);

    return res.json({
      users,
      categories,
      words,
      progress,
      sessions,
      badges,
      userBadges,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to fetch table counts' });
  }
});

// ── USERS CRUD ────────────────────────────────────────────────────────────────
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.user.findMany({
      include: {
        progress: true,
        badges: { include: { badge: true } },
        sessions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

const handleUserUpsert = async (req: AuthRequest, res: Response) => {
  const paramId = req.params.id as string | undefined;
  const { id, name, username, avatar, ageGroup, locality, hearts, streak, xp, onboarded, password } = req.body;

  const rawId = paramId || id;
  const targetId = (typeof rawId === 'string' && rawId.trim().length > 0) ? rawId.trim() : undefined;
  const targetUsername = username ? String(username).toLowerCase().trim() : undefined;

  try {
    let where: any;
    if (targetId) {
      where = { id: targetId };
    } else if (targetUsername) {
      where = { username: targetUsername };
    } else {
      return res.status(400).json({ error: 'Username or ID is required' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name);
    if (targetUsername) updateData.username = targetUsername;
    if (avatar !== undefined) updateData.avatar = String(avatar);
    if (ageGroup !== undefined) updateData.ageGroup = String(ageGroup);
    if (locality !== undefined) updateData.locality = String(locality);
    if (hearts !== undefined) updateData.hearts = parseInt(hearts);
    if (streak !== undefined) updateData.streak = parseInt(streak);
    if (xp !== undefined) updateData.xp = parseInt(xp);
    if (onboarded !== undefined) updateData.onboarded = !!onboarded;

    const defaultPasswordHash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('muku123', 10);

    const createData = {
      ...(targetId ? { id: targetId } : {}),
      name: name ? String(name) : targetUsername || 'User',
      username: targetUsername || `user_${Date.now()}`,
      passwordHash: defaultPasswordHash,
      avatar: avatar ? String(avatar) : 'Kanchha',
      ageGroup: ageGroup ? String(ageGroup) : '4-6',
      locality: locality ? String(locality) : '',
      hearts: hearts !== undefined ? parseInt(hearts) : 5,
      streak: streak !== undefined ? parseInt(streak) : 0,
      xp: xp !== undefined ? parseInt(xp) : 0,
      onboarded: onboarded !== undefined ? !!onboarded : true,
    };

    const data = await prisma.user.upsert({
      where,
      update: updateData,
      create: createData,
    });
    return res.json(data);
  } catch (e) {
    console.error('Failed to save user:', e);
    return res.status(500).json({ error: 'Failed to save user' });
  }
};

router.post('/users', handleUserUpsert);
router.post('/users/:id', handleUserUpsert);

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.user.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ── CATEGORIES CRUD ───────────────────────────────────────────────────────────
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.category.findMany({
      orderBy: { order: 'asc' },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

const handleCategoryUpsert = async (req: AuthRequest, res: Response) => {
  const paramId = req.params.id as string | undefined;
  const { id, name, slug, emoji, color, borderColor, order, isLocked, unlockLevel } = req.body;

  const rawId = paramId || id;
  const targetId = (typeof rawId === 'string' && rawId.trim().length > 0) ? rawId.trim() : undefined;
  const targetSlug = slug ? String(slug).toLowerCase().trim() : '';

  try {
    const payload = {
      name: String(name || ''),
      slug: targetSlug,
      emoji: String(emoji || ''),
      color: String(color || '#FFC107'),
      borderColor: String(borderColor || '#785900'),
      order: order !== undefined ? parseInt(order) : 0,
      isLocked: !!isLocked,
      unlockLevel: unlockLevel !== undefined ? parseInt(unlockLevel) : 0,
    };

    const where = targetId ? { id: targetId } : { slug: targetSlug };

    const data = await prisma.category.upsert({
      where,
      update: payload,
      create: {
        ...(targetId ? { id: targetId } : {}),
        ...payload,
      },
    });
    return res.json(data);
  } catch (e) {
    console.error('Failed to save category:', e);
    return res.status(500).json({ error: 'Failed to save category' });
  }
};

router.post('/categories', handleCategoryUpsert);
router.post('/categories/:id', handleCategoryUpsert);

router.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.category.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ── WORDS CRUD ────────────────────────────────────────────────────────────────
router.get('/words', async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.word.findMany({
      include: { category: true },
      orderBy: [{ categoryId: 'asc' }, { order: 'asc' }],
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch words' });
  }
});

const handleWordUpsert = async (req: AuthRequest, res: Response) => {
  const paramId = req.params.id as string | undefined;
  const { id, categoryId, nepali, nepaliRoman, english, phonetic, emoji, audioUrl, order } = req.body;

  const rawId = paramId || id;
  let targetId = (typeof rawId === 'string' && rawId.trim().length > 0) ? rawId.trim() : undefined;

  try {
    if (!targetId && categoryId && nepali) {
      const existing = await prisma.word.findFirst({
        where: { categoryId: String(categoryId), nepali: String(nepali) },
      });
      if (existing) {
        targetId = existing.id;
      }
    }

    const finalId = targetId || crypto.randomUUID();

    const payload = {
      categoryId: String(categoryId || ''),
      nepali: String(nepali || ''),
      nepaliRoman: String(nepaliRoman || ''),
      english: String(english || ''),
      phonetic: String(phonetic || ''),
      emoji: String(emoji || ''),
      audioUrl: audioUrl ? String(audioUrl) : null,
      order: order !== undefined ? parseInt(order) : 0,
    };

    const data = await prisma.word.upsert({
      where: { id: finalId },
      update: payload,
      create: {
        id: finalId,
        ...payload,
      },
    });
    return res.json(data);
  } catch (e) {
    console.error('Failed to save word:', e);
    return res.status(500).json({ error: 'Failed to save word' });
  }
};

router.post('/words', handleWordUpsert);
router.post('/words/:id', handleWordUpsert);

// Delete Word
router.delete('/words/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.word.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete word' });
  }
});

// ── PROGRESS CRUD ─────────────────────────────────────────────────────────────
router.get('/progress', async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.progress.findMany({
      include: { user: true, category: true },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

const handleProgressUpsert = async (req: AuthRequest, res: Response) => {
  const paramId = req.params.id as string | undefined;
  const { id, userId, categoryId, wordsLearned, correctAnswers, totalAnswers } = req.body;

  const rawId = paramId || id;
  const targetId = (typeof rawId === 'string' && rawId.trim().length > 0) ? rawId.trim() : undefined;

  try {
    const payload = {
      userId: String(userId || ''),
      categoryId: String(categoryId || ''),
      wordsLearned: parseInt(wordsLearned || 0),
      correctAnswers: parseInt(correctAnswers || 0),
      totalAnswers: parseInt(totalAnswers || 0),
    };

    const where = targetId
      ? { id: targetId }
      : { userId_categoryId: { userId: String(userId), categoryId: String(categoryId) } };

    const data = await prisma.progress.upsert({
      where,
      update: payload,
      create: {
        ...(targetId ? { id: targetId } : {}),
        ...payload,
      },
    });
    return res.json(data);
  } catch (e) {
    console.error('Failed to save progress:', e);
    return res.status(500).json({ error: 'Failed to save progress' });
  }
};

router.post('/progress', handleProgressUpsert);
router.post('/progress/:id', handleProgressUpsert);

router.delete('/progress/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.progress.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete progress' });
  }
});

// ── LESSON SESSIONS CRUD ──────────────────────────────────────────────────────
router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.lessonSession.findMany({
      include: { user: true, category: true },
      orderBy: { completedAt: 'desc' },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.delete('/sessions/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.lessonSession.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete session' });
  }
});

// ── BADGES CRUD ───────────────────────────────────────────────────────────────
router.get('/badges', async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.badge.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

const handleBadgeUpsert = async (req: AuthRequest, res: Response) => {
  const paramId = req.params.id as string | undefined;
  const { id, slug, name, emoji, description } = req.body;

  const rawId = paramId || id;
  const targetId = (typeof rawId === 'string' && rawId.trim().length > 0) ? rawId.trim() : undefined;
  const targetSlug = slug ? String(slug).toLowerCase().trim() : '';

  try {
    const payload = {
      slug: targetSlug,
      name: String(name || ''),
      emoji: String(emoji || ''),
      description: String(description || ''),
    };

    const where = targetId ? { id: targetId } : { slug: targetSlug };

    const data = await prisma.badge.upsert({
      where,
      update: payload,
      create: {
        ...(targetId ? { id: targetId } : {}),
        ...payload,
      },
    });
    return res.json(data);
  } catch (e) {
    console.error('Failed to save badge:', e);
    return res.status(500).json({ error: 'Failed to save badge' });
  }
};

router.post('/badges', handleBadgeUpsert);
router.post('/badges/:id', handleBadgeUpsert);

router.delete('/badges/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.badge.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete badge' });
  }
});

// ── USER BADGES (AWARDING/REVOKING) CRUD ──────────────────────────────────────
router.get('/user-badges', async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.userBadge.findMany({
      include: { user: true, badge: true },
      orderBy: { awardedAt: 'desc' },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch user badges' });
  }
});

router.post('/user-badges', async (req: AuthRequest, res: Response) => {
  const { userId, badgeId } = req.body;
  try {
    const data = await prisma.userBadge.upsert({
      where: {
        userId_badgeId: { userId: String(userId), badgeId: String(badgeId) },
      },
      update: {},
      create: {
        userId: String(userId),
        badgeId: String(badgeId),
      },
    });
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to award badge' });
  }
});

router.delete('/user-badges/:userId/:badgeId', async (req: AuthRequest, res: Response) => {
  const userId = req.params.userId as string;
  const badgeId = req.params.badgeId as string;
  try {
    await prisma.userBadge.delete({
      where: {
        userId_badgeId: { userId, badgeId },
      },
    });
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to revoke badge' });
  }
});

// ── DATA DELETION REQUESTS CRUD ───────────────────────────────────────────────
router.get('/deletion-requests', async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.dataDeletionRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch deletion requests' });
  }
});

router.patch('/deletion-requests/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  try {
    const data = await prisma.dataDeletionRequest.update({
      where: { id },
      data: { status },
    });
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update deletion request' });
  }
});

router.delete('/deletion-requests/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.dataDeletionRequest.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete deletion request' });
  }
});

export default router;
