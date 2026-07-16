import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma, { getPrismaForUser } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;

// Helper to strip sensitive fields from user
function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, parentPin, ...safeUser } = user;
  return safeUser;
}

// Helper to generate JWT
function generateToken(user: { id: string; username: string }) {
  return jwt.sign(
    { id: user.id, username: user.username, role: 'authenticated' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// ── Register / Onboard User ───────────────────────────────────────────────────
const CreateUserSchema = z.object({
  name: z.string().min(1).max(50),
  username: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, underscores, and hyphens'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  avatar: z.string(),
  ageGroup: z.enum(['4-6', '7-10']),
  locality: z.string(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { name, username, password, avatar, ageGroup, locality } = parsed.data;

  try {
    // Uniqueness check (we query with main prisma instance for initial check)
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUserId = crypto.randomUUID();

    // To satisfy RLS for inserting own record:
    // policy check: id = auth.uid()::text
    const userPrisma = getPrismaForUser(newUserId);
    const user = await userPrisma.user.create({
      data: {
        id: newUserId,
        name,
        username: username.toLowerCase(),
        passwordHash,
        avatar,
        ageGroup,
        locality,
        onboarded: true,
        hearts: 5,
        streak: 0,
        xp: 0,
      },
      include: {
        progress: { include: { category: true } },
        badges: { include: { badge: true } },
        sessions: {
          orderBy: { completedAt: 'desc' },
          take: 30,
        },
      },
    });

    const token = generateToken(user);
    return res.status(201).json({ user: sanitizeUser(user), token });
  } catch (e) {
    console.error('Error creating user:', e);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// ── Login User ───────────────────────────────────────────────────────────────
const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { username, password } = parsed.data;

  try {
    if (username.toLowerCase() === 'admin') {
      const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
      if (password === adminPass) {
        const token = jwt.sign(
          { id: 'admin-id', username: 'admin', role: 'admin' },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({
          user: {
            id: 'admin-id',
            username: 'admin',
            name: 'System Admin',
            avatar: 'Mojo',
            ageGroup: '7-10',
            locality: 'HQ',
            hearts: 999,
            streak: 999,
            xp: 999,
            onboarded: true,
            createdAt: new Date().toISOString(),
            progress: [],
            badges: [],
            sessions: []
          },
          token
        });
      } else {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        progress: { include: { category: true } },
        badges: { include: { badge: true } },
        sessions: {
          orderBy: { completedAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);
    return res.json({ user: sanitizeUser(user), token });
  } catch (e) {
    console.error('Error logging in user:', e);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// ── Find User by Username (check availability/lookups) ──────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  const queryVal = (req.query.username || req.query.name) as string | undefined;
  if (!queryVal || queryVal.trim().length === 0) {
    return res.status(400).json({ error: 'username or name query param required' });
  }
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: queryVal.trim().toLowerCase() } },
          { name: { equals: queryVal.trim(), mode: 'insensitive' } }
        ]
      },
      include: {
        progress: { include: { category: true } },
        badges: { include: { badge: true } },
        sessions: { orderBy: { completedAt: 'desc' }, take: 30 },
      },
    });
    if (!user) return res.status(404).json({ error: 'No account found with that username' });
    return res.json(sanitizeUser(user));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to look up user' });
  }
});

// ── Get User Profile ─────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (req.user?.id !== id) {
    return res.status(403).json({ error: 'Access denied: You can only access your own profile' });
  }

  try {
    const userPrisma = getPrismaForUser(id);
    const user = await userPrisma.user.findUnique({
      where: { id },
      include: {
        progress: { include: { category: true } },
        badges: { include: { badge: true } },
        sessions: {
          orderBy: { completedAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(sanitizeUser(user));
  } catch (e) {
    console.error('Error fetching user:', e);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ── Update User Profile ───────────────────────────────────────────────────────
const UpdateUserSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z.string().optional(),
  ageGroup: z.enum(['4-6', '7-10']).optional(),
  locality: z.string().optional(),
});

router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (req.user?.id !== id) {
    return res.status(403).json({ error: 'Access denied: You can only modify your own profile' });
  }

  const parsed = UpdateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const userPrisma = getPrismaForUser(id);
    const user = await userPrisma.user.update({
      where: { id },
      data: parsed.data,
      include: {
        progress: { include: { category: true } },
        badges: { include: { badge: true } },
        sessions: {
          orderBy: { completedAt: 'desc' },
          take: 30,
        },
      },
    });
    return res.json(sanitizeUser(user));
  } catch (e) {
    console.error('Error updating user:', e);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── Deduct Heart ──────────────────────────────────────────────────────────────
router.post('/:id/hearts/deduct', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (req.user?.id !== id) return res.status(403).json({ error: 'Access denied' });

  try {
    const userPrisma = getPrismaForUser(id);
    const user = await userPrisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newHearts = Math.max(0, user.hearts - 1);
    const updated = await userPrisma.user.update({
      where: { id },
      data: { hearts: newHearts },
      select: { id: true, hearts: true },
    });
    return res.json(updated);
  } catch (e) {
    console.error('Error deducting heart:', e);
    return res.status(500).json({ error: 'Failed to deduct heart' });
  }
});

// ── Refill Hearts (+2 via ad, capped at 5) ───────────────────────────────────
router.post('/:id/hearts/refill', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (req.user?.id !== id) return res.status(403).json({ error: 'Access denied' });

  try {
    const userPrisma = getPrismaForUser(id);
    const existing = await userPrisma.user.findUnique({ where: { id }, select: { hearts: true } });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const newHearts = Math.min(5, existing.hearts + 2);
    const updated = await userPrisma.user.update({
      where: { id },
      data: { hearts: newHearts },
      select: { id: true, hearts: true },
    });
    return res.json(updated);
  } catch (e) {
    console.error('Error refilling hearts:', e);
    return res.status(500).json({ error: 'Failed to refill hearts' });
  }
});

// ── Set Parent PIN ────────────────────────────────────────────────────────────
const PinSchema = z.object({ pin: z.string().length(4).regex(/^\d{4}$/) });

router.post('/:id/pin', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (req.user?.id !== id) return res.status(403).json({ error: 'Access denied' });

  const parsed = PinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'PIN must be exactly 4 digits' });

  try {
    const hash = await bcrypt.hash(parsed.data.pin, 10);
    const userPrisma = getPrismaForUser(id);
    await userPrisma.user.update({
      where: { id },
      data: { parentPin: hash },
    });
    return res.json({ success: true });
  } catch (e) {
    console.error('Error setting PIN:', e);
    return res.status(500).json({ error: 'Failed to set PIN' });
  }
});

// ── Verify Parent PIN ─────────────────────────────────────────────────────────
router.post('/:id/pin/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (req.user?.id !== id) return res.status(403).json({ error: 'Access denied' });

  const parsed = PinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'PIN must be exactly 4 digits' });

  try {
    const userPrisma = getPrismaForUser(id);
    const user = await userPrisma.user.findUnique({ where: { id } });
    if (!user || !user.parentPin) {
      return res.status(404).json({ error: 'No PIN set for this user' });
    }

    const isMatch = await bcrypt.compare(parsed.data.pin, user.parentPin);
    return res.json({ valid: isMatch });
  } catch (e) {
    console.error('Error verifying PIN:', e);
    return res.status(500).json({ error: 'Failed to verify PIN' });
  }
});

export default router;
