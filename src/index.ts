import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import usersRouter from './routes/users';
import categoriesRouter from './routes/categories';
import sessionsRouter from './routes/sessions';
import leaderboardRouter from './routes/leaderboard';
import adminRouter from './routes/admin';
import path from 'path';

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());


app.use('/admin',express.static(path.join(__dirname,'../admin')));
// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin', adminRouter);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Muku API running on http://localhost:${PORT}`);
});

export default app;
