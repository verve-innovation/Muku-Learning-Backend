import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ── IMPORT WORDS FROM CSV/EXCEL ─────────────────────────────────────────────────
type WordImportRow = {
  categorySlug: string;
  nepali: string;
  nepaliRoman: string;
  english: string;
  lessonSlug?: string;
  phonetic: string;
  emoji: string;
  order: number;
  audioUrl?: string;
};

async function getOrCreateLesson(categoryId: string, lessonSlug: string): Promise<string> {
  // Try to find existing lesson
  const existingLesson = await prisma.lesson.findUnique({
    where: {
      slug: lessonSlug,
      categoryId,
    },
  });

  if (existingLesson) {
    return existingLesson.id;
  }

  // Create new lesson
  const newLesson = await prisma.lesson.create({
    data: {
      categoryId,
      slug: lessonSlug,
      name: lessonSlug,
      order: 1,
    },
  });

  return newLesson.id;
}

router.post('/words/import', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows)) {
      return res.status(400).json({ error: 'Data must be an array of rows' });
    }

    const importResults = {
      success: [] as any[],
      failed: [] as { row: WordImportRow; error: string }[],
    };

    for (const wordData of rows) {
      try {
        // Validate required fields
        if (!wordData.categorySlug || !wordData.nepali || !wordData.english || !wordData.phonetic || !wordData.emoji) {
          throw new Error('Missing required fields');
        }

        // Find category by slug
        const category = await prisma.category.findUnique({
          where: { slug: wordData.categorySlug },
        });

        if (!category) {
          throw new Error(`Category not found with slug: ${wordData.categorySlug}`);
        }

        // Find or create lesson if lessonSlug is provided
        let lessonId = null;
        if (wordData.lessonSlug) {
          lessonId = await getOrCreateLesson(category.id, wordData.lessonSlug);
        }

        // Create the word
        const word = await prisma.word.create({
          data: {
            categoryId: category.id,
            lessonId: lessonId,
            nepali: wordData.nepali,
            nepaliRoman: wordData.nepaliRoman,
            english: wordData.english,
            phonetic: wordData.phonetic,
            emoji: wordData.emoji,
            audioUrl: wordData.audioUrl || null,
            order: parseInt(wordData.order) || 0,
          },
        });

        importResults.success.push(word);
      } catch (error: any) {
        importResults.failed.push({
          row: wordData,
          error: error.message || 'Unknown error',
        });
      }
    }

    return res.json(importResults);
  } catch (e) {
    console.error('Failed to import words:', e);
    return res.status(500).json({ error: 'Failed to import words' });
  }
});

// ── GET LESSONS ────────────────────────────────────────────────────────────────
router.get('/lessons', async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.lesson.findMany({
      include: { category: true },
      orderBy: { order: 'asc' },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

router.post('/lessons', async (req: AuthRequest, res: Response) => {
  const { categoryId, slug, name, order } = req.body;
  try {
    const data = await prisma.lesson.create({
      data: {
        categoryId,
        slug,
        name,
        order: order || 1,
      },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create lesson' });
  }
});

router.post('/lessons/import', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ error: 'Data must be an array of rows' });
    }

    const importResults = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const row of rows) {
      try {
        if (!row.categorySlug || !row.slug || !row.name) {
          throw new Error('Missing required fields: categorySlug, slug, name');
        }

        const category = await prisma.category.findUnique({
          where: { slug: row.categorySlug },
        });

        if (!category) {
          throw new Error(`Category not found with slug: ${row.categorySlug}`);
        }

        const lesson = await prisma.lesson.upsert({
          where: { slug: row.slug }, // slug is unique globally based on schema
          update: {
            name: row.name,
            order: parseInt(row.order) || 1,
            categoryId: category.id,
          },
          create: {
            slug: row.slug,
            name: row.name,
            order: parseInt(row.order) || 1,
            categoryId: category.id,
          },
        });

        importResults.success.push(lesson);
      } catch (error: any) {
        importResults.failed.push({ row, error: error.message || 'Unknown error' });
      }
    }

    return res.json(importResults);
  } catch (e) {
    console.error('Failed to import lessons:', e);
    return res.status(500).json({ error: 'Failed to import lessons' });
  }
});

router.post('/lessons/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { categoryId, slug, name, order } = req.body;
  try {
    const data = await prisma.lesson.update({
      where: { id },
      data: {
        categoryId,
        slug,
        name,
        order: order !== undefined ? order : undefined,
      },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update lesson' });
  }
});

router.delete('/lessons/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.lesson.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

router.get('/lessons/category/:categoryId', async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = req.params.categoryId;
    const data = await prisma.lesson.findMany({
      where: { categoryId },
      orderBy: { order: 'asc' },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

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
      include: { category: true, lesson: true },
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

// ── FILL BLANKS CRUD ─────────────────────────────────────────────────────────────
router.get('/fill-blanks', async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.fillBlank.findMany({
      include: { lesson: true, word: true },
      orderBy: [{ lessonId: 'asc' }, { order: 'asc' }],
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch fill blanks' });
  }
});

router.post('/fill-blanks/import', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ error: 'Data must be an array of rows' });
    }

    const importResults = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const row of rows) {
      try {
        if (!row.Lesson_slug || !row.word_nepali || !row.sentenceTemplate || !row.blankAnswer || !row.englishHint) {
          throw new Error('Missing required fields');
        }

        // 1. Find lesson by slug
        const lesson = await prisma.lesson.findUnique({
          where: { slug: row.Lesson_slug },
        });

        if (!lesson) {
          throw new Error(`Lesson not found with slug: ${row.Lesson_slug}`);
        }

        // 2. Find word by nepali text and the lesson's category
        const word = await prisma.word.findFirst({
          where: { 
            nepali: row.word_nepali,
            categoryId: lesson.categoryId
          },
        });

        if (!word) {
          throw new Error(`Word not found with nepali text '${row.word_nepali}' in lesson's category`);
        }

        // 3. Create Fill Blank question
        const fillBlank = await prisma.fillBlank.create({
          data: {
            lessonId: lesson.id,
            wordId: word.id,
            sentenceTemplate: row.sentenceTemplate,
            blankAnswer: row.blankAnswer,
            englishHint: row.englishHint,
            emoji: row.emoji || '',
            order: parseInt(row.order) || 0,
          },
        });

        importResults.success.push(fillBlank);
      } catch (error: any) {
        importResults.failed.push({ row, error: error.message || 'Unknown error' });
      }
    }

    return res.json(importResults);
  } catch (e) {
    console.error('Failed to import fill blanks:', e);
    return res.status(500).json({ error: 'Failed to import fill blanks' });
  }
});

router.post('/fill-blanks', async (req: AuthRequest, res: Response) => {
  const { lessonId, wordId, sentenceTemplate, blankAnswer, englishHint, emoji, order } = req.body;
  try {
    const data = await prisma.fillBlank.create({
      data: {
        lessonId,
        wordId,
        sentenceTemplate,
        blankAnswer,
        englishHint,
        emoji: emoji || '',
        order: parseInt(order) || 0,
      },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create fill blank' });
  }
});

router.post('/fill-blanks/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { lessonId, wordId, sentenceTemplate, blankAnswer, englishHint, emoji, order } = req.body;
  try {
    const data = await prisma.fillBlank.update({
      where: { id },
      data: {
        lessonId,
        wordId,
        sentenceTemplate,
        blankAnswer,
        englishHint,
        emoji,
        order: order !== undefined ? parseInt(order) : undefined,
      },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update fill blank' });
  }
});

router.delete('/fill-blanks/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.fillBlank.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete fill blank' });
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
