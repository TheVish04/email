import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import { startMailPoller, initialSyncInbox } from './services/mailPoller.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', ticketRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

function srvToStandardUri(srvUri) {
  const match = srvUri.match(/mongodb\+srv:\/\/([^@]+)@([^/]+)\/([^?]*)(\?.*)?/);
  if (!match) return null;
  const [, auth, host, db, query] = match;
  const q = (query || '') + (query && query.includes('ssl') ? '' : '&ssl=true');
  return `mongodb://${auth}@${host}:27017/${db}${q}`;
}

async function connectMongo() {
  if (!config.mongodbUri) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }
  try {
    await mongoose.connect(config.mongodbUri);
    return;
  } catch (err) {
    const isSrvFailure = (err.code === 'ECONNREFUSED' || err.syscall === 'querySrv') && config.mongodbUri.startsWith('mongodb+srv://');
    if (isSrvFailure) {
      const fallback = srvToStandardUri(config.mongodbUri);
      if (fallback) {
        console.log('SRV lookup failed, trying standard connection (host:27017)...');
        await mongoose.connect(fallback);
        return;
      }
    }
    throw err;
  }
}

async function start() {
  await connectMongo();
  console.log('MongoDB connected');
  app.listen(config.port, async () => {
    console.log(`Server listening on port ${config.port}`);
    if (config.imap?.user && config.imap?.pass) {
      try {
        const result = await initialSyncInbox(100);
        console.log('[MailPoller] Startup sync:', result.ok ? `saved ${result.processed} tickets` : result.error);
      } catch (err) {
        console.error('[MailPoller] Startup sync failed:', err.message);
      }
      startMailPoller();
    } else {
      console.log('[MailPoller] IMAP not configured (set IMAP_USER and IMAP_PASS to enable)');
    }
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
