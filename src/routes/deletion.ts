import { Router, Response, Request } from 'express';
import { z } from 'zod';
import prisma from '../db';

const router = Router();

const DeletionRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  reason: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = DeletionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, reason } = parsed.data;

  try {
    const data = await prisma.dataDeletionRequest.create({
      data: {
        email: email.toLowerCase(),
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
