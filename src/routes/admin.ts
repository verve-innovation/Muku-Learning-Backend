import { Router, Response } from 'express';
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

router.post('/users/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { name, username, avatar, ageGroup, locality, hearts, streak, xp, onboarded } = req.body;
  try {
    const data = await prisma.user.update({
      where: { id },
      data: {
        name,
        username: username?.toLowerCase(),
        avatar,
        ageGroup,
        locality,
        hearts: hearts !== undefined ? parseInt(hearts) : undefined,
        streak: streak !== undefined ? parseInt(streak) : undefined,
        xp: xp !== undefined ? parseInt(xp) : undefined,
        onboarded,
      },
    });
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

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

router.post('/categories', async (req: AuthRequest, res: Response) => {
  const { id, name, slug, emoji, color, borderColor, order, isLocked, unlockLevel } = req.body;
  try {
    const payload = {
      name,
      slug: slug.toLowerCase(),
      emoji,
      color,
      borderColor,
      order: order !== undefined ? parseInt(order) : 0,
      isLocked: !!isLocked,
      unlockLevel: unlockLevel !== undefined ? parseInt(unlockLevel) : 0,
    };

    let data;
    if (id) {
      data = await prisma.category.update({ where: { id: id as string }, data: payload });
    } else {
      data = await prisma.category.create({ data: payload });
    }
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to save category' });
  }
});

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

router.post('/words', async (req: AuthRequest, res: Response) => {
  const { id, categoryId, nepali, nepaliRoman, english, phonetic, emoji, audioUrl, order } = req.body;
  try {
    const payload = {
      categoryId,
      nepali,
      nepaliRoman,
      english,
      phonetic,
      emoji,
      audioUrl,
      order: order !== undefined ? parseInt(order) : 0,
    };

    let data;
    if (id) {
      data = await prisma.word.update({ where: { id: id as string }, data: payload });
    } else {
      data = await prisma.word.create({ data: payload });
    }
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to save word' });
  }
});

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

router.post('/progress', async (req: AuthRequest, res: Response) => {
  const { id, userId, categoryId, wordsLearned, correctAnswers, totalAnswers } = req.body;
  try {
    const payload = {
      userId,
      categoryId,
      wordsLearned: parseInt(wordsLearned || 0),
      correctAnswers: parseInt(correctAnswers || 0),
      totalAnswers: parseInt(totalAnswers || 0),
    };

    let data;
    if (id) {
      data = await prisma.progress.update({ where: { id: id as string }, data: payload });
    } else {
      data = await prisma.progress.create({ data: payload });
    }
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to save progress' });
  }
});

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

router.post('/badges', async (req: AuthRequest, res: Response) => {
  const { id, slug, name, emoji, description } = req.body;
  try {
    const payload = {
      slug: slug.toLowerCase(),
      name,
      emoji,
      description,
    };

    let data;
    if (id) {
      data = await prisma.badge.update({ where: { id: id as string }, data: payload });
    } else {
      data = await prisma.badge.create({ data: payload });
    }
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to save badge' });
  }
});

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
    const data = await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
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
