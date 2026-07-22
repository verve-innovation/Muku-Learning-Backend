import { Router, Response, Request } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../db';

const router = Router();

const DeletionRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  reason: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = DeletionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { username, password, reason } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const data = await prisma.dataDeletionRequest.create({
      data: {
        username: username.toLowerCase(),
        reason,
        status: 'pending',
      },
    });
    
    return res.status(201).json({ success: true, request: data });
  } catch (e) {
    console.error('Error creating data deletion request:', e);
    return res.status(500).json({ error: 'Failed to create data deletion request' });
  }
});

export default router;
