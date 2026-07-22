import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import usersRouter from './routes/users';
import categoriesRouter from './routes/categories';
import sessionsRouter from './routes/sessions';
import leaderboardRouter from './routes/leaderboard';
import adminRouter from './routes/admin';
import deletionRouter from './routes/deletion';
import path from 'path';

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());


const adminDir = path.join(__dirname, '../muku-admin/dist');
app.use('/admin', express.static(adminDir));
app.get('/admin*', (_req, res) => res.sendFile(path.join(adminDir, 'index.html')));
// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/',(_req, res)=>res.sendFile(path.join(__dirname,'..','index.html')))
app.get('/privacypolicy',(_req, res)=>res.sendFile(path.join(__dirname,'..','privacypolicy.html')))
app.get('/delete-data',(_req, res)=>res.sendFile(path.join(__dirname,'..','delete-data.html')))
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/deletion-requests', deletionRouter);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Muku API running now`);
});

export default app;
