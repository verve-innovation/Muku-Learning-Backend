import { Router, Response } from 'express';
import { z } from 'zod';
import { getPrismaForUser } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const SessionSchema = z.object({
  userId: z.string().min(1),
  categorySlug: z.string().min(1),
  lessonSlug: z.string().optional(),
  correctAnswers: z.number().int().min(0),
  totalAnswers: z.number().int().min(0),
  durationSec: z.number().int().min(0),
  locality: z.string(),
});

/** XP is computed server-side so clients cannot inflate scores. */
function computeXpGained(correctAnswers: number, totalAnswers: number): number {
  if (totalAnswers === 0) return 0;
  const accuracy = correctAnswers / totalAnswers;
  const base = correctAnswers * 10;
  const accuracyBonus = Math.round(accuracy * 20);
  const completionBonus = 15;
  return Math.max(10, base + accuracyBonus + completionBonus);
}

// ── Complete a Lesson Session ─────────────────────────────────────────────────
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = SessionSchema.safeParse(req.body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(fieldErrors).flatMap(([k, v]) =>
      (v ?? []).map((m) => `${k}: ${m}`)
    );
    return res.status(400).json({ error: messages.join('; ') || 'Invalid request body' });
  }

  const { userId, categorySlug, lessonSlug, correctAnswers, totalAnswers, durationSec, locality } = parsed.data;
  const xpGained = computeXpGained(correctAnswers, totalAnswers);

  // Security check: Make sure user is submitting session for themselves
  if (req.user!.id !== userId) {
    return res.status(403).json({ error: 'Access denied: Cannot record session for another user' });
  }

  const accuracy = totalAnswers > 0 ? correctAnswers / totalAnswers : 0;

  try {
    const userPrisma = getPrismaForUser(userId);

    // 1. Fetch category
    const category = await userPrisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    // 2. Fetch current user
    const user = await userPrisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 3. Upsert progress record
    const progress = await userPrisma.progress.upsert({
      where: { userId_categoryId: { userId, categoryId: category.id } },
      update: {
        correctAnswers: { increment: correctAnswers },
        totalAnswers: { increment: totalAnswers },
        wordsLearned: { increment: correctAnswers },
        lastPlayedAt: new Date(),
      },
      create: {
        userId,
        categoryId: category.id,
        correctAnswers,
        totalAnswers,
        wordsLearned: correctAnswers,
        lastPlayedAt: new Date(),
      },
    });

    // 4. Create session record
    const session = await userPrisma.lessonSession.create({
      data: {
        userId,
        categoryId: category.id,
        lessonSlug: lessonSlug || null,
        xpGained,
        accuracy,
        durationSec,
        locality,
      },
    });

    // 5. Update user XP; increment streak only once per calendar day
    const today = new Date().toDateString();
    const lastSession = await userPrisma.lessonSession.findFirst({
      where: { userId, id: { not: session.id } },
      orderBy: { completedAt: 'desc' },
    });
    const lastSessionDate = lastSession ? new Date(lastSession.completedAt).toDateString() : null;
    const shouldIncrementStreak = lastSessionDate !== today;

    const updatedUser = await userPrisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpGained },
        ...(shouldIncrementStreak ? { streak: { increment: 1 } } : {}),
      },
      select: { id: true, xp: true, streak: true, hearts: true },
    });

    // 6. Unlock the next category when this one is fully complete
    const wordCount = await userPrisma.word.count({ where: { categoryId: category.id } });
    if (wordCount > 0 && progress.wordsLearned >= wordCount) {
      const nextCategory = await userPrisma.category.findFirst({
        where: { order: { gt: category.order }, isLocked: true },
        orderBy: { order: 'asc' },
      });
      if (nextCategory) {
        await userPrisma.category.update({
          where: { id: nextCategory.id },
          data: { isLocked: false },
        });
      }
    }

    // 7. Award badges if criteria met
    const badges = await awardBadges(userPrisma, userId, updatedUser.xp, updatedUser.streak, accuracy, durationSec);

    return res.status(201).json({ session, progress, user: updatedUser, newBadges: badges });
  } catch (e) {
    console.error('Error recording session:', e);
    return res.status(500).json({ error: 'Failed to record session' });
  }
});

// ── Badge Awarding Logic (scoped to user's Prisma client) ─────────────────────
async function awardBadges(
  userPrisma: any,
  userId: string,
  xp: number,
  streak: number,
  accuracy: number,
  durationSec: number
): Promise<string[]> {
  const newBadges: string[] = [];

  const checks: { slug: string; condition: boolean }[] = [
    { slug: 'first-lesson', condition: true }, // always on first session completion
    { slug: 'streak-3', condition: streak >= 3 },
    { slug: 'streak-7', condition: streak >= 7 },
    { slug: 'perfect-score', condition: accuracy === 1.0 },
    { slug: 'fast-learner', condition: durationSec <= 60 },
    { slug: 'xp-100', condition: xp >= 100 },
  ];

  for (const { slug, condition } of checks) {
    if (!condition) continue;

    const badge = await userPrisma.badge.findUnique({ where: { slug } });
    if (!badge) continue;

    // Try to award — skip if already owned
    try {
      await userPrisma.userBadge.create({ data: { userId, badgeId: badge.id } });
      newBadges.push(badge.emoji);
    } catch (_) {
      // Already has badge — ignore unique constraint error
    }
  }

  return newBadges;
}

export default router;
