import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { config } from '../config.js';
import { classifyEmail } from './groq.js';
import { Ticket } from '../models/Ticket.js';

function getSender(envelope) {
  const from = envelope?.from?.[0];
  if (!from) return '';
  if (typeof from === 'object' && from.address) return from.address;
  if (typeof from === 'string') return from;
  return '';
}

async function processMessage(client, msg) {
  const raw = msg.source;
  if (!raw) return;
  const parsed = await simpleParser(raw);
  const subject = parsed.subject || '(No subject)';
  const body = parsed.text || parsed.html?.replace(/<[^>]+>/g, ' ') || '';
  const sender = parsed.from?.text || getSender(msg.envelope) || '';
  const messageId = parsed.messageId || null;

  if (messageId) {
    const existing = await Ticket.findOne({ messageId });
    if (existing) return;
  }

  const result = await classifyEmail(subject, body.slice(0, 10000));
  await Ticket.create({
    subject,
    body: body.slice(0, 5000),
    sender,
    department: result.department,
    priority: result.priority,
    intensity: result.intensity,
    sentiment: result.sentiment,
    confidenceDepartment: result.confidenceDepartment,
    confidencePriority: result.confidencePriority,
    explanationDepartment: result.explanationDepartment,
    explanationPriority: result.explanationPriority,
    suggestedSlaHours: result.suggestedSlaHours,
    seen: false,
    status: 'open',
    source: 'external',
    messageId,
  });
  await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
  console.log('[MailPoller] Classified and saved:', subject.slice(0, 50));
}

export async function pollInbox() {
  const { imap } = config;
  if (!imap.user || !imap.pass) {
    console.log('[MailPoller] IMAP_USER or IMAP_PASS not set, skipping poll');
    return { ok: false, processed: 0, error: 'IMAP credentials not set' };
  }

  console.log('[MailPoller] Connecting to', imap.host, 'as', imap.user);
  const client = new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: true,
    auth: { user: imap.user, pass: imap.pass },
    logger: false,
  });

  let lock;
  let processed = 0;
  try {
    await client.connect();
    console.log('[MailPoller] Connected');
    lock = await client.getMailboxLock('INBOX');
    const unseenUids = await client.search({ seen: false }, { uid: true });
    console.log('[MailPoller] Unseen messages:', unseenUids.length);
    if (unseenUids.length === 0) {
      return { ok: true, processed: 0 };
    }
    const messages = await client.fetchAll(unseenUids, { envelope: true, source: true }, { uid: true });
    for (const msg of messages) {
      try {
        await processMessage(client, msg);
        processed++;
      } catch (err) {
        console.error('[MailPoller] Error processing message:', err.message, err.stack);
      }
    }
    return { ok: true, processed };
  } catch (err) {
    console.error('[MailPoller] Poll error:', err.message, err.stack);
    return { ok: false, processed: 0, error: err.message };
  } finally {
    if (lock) lock.release();
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
}

/** Fetch last N messages (read or unread) and import any we don't have. Run once on startup or via Sync inbox. */
export async function initialSyncInbox(limit = 100) {
  const { imap } = config;
  const maxLimit = Math.min(Math.max(1, parseInt(limit, 10) || 100), 300);
  if (!imap.user || !imap.pass) {
    console.log('[MailPoller] Initial sync skipped: IMAP_USER or IMAP_PASS not set');
    return { ok: false, processed: 0, error: 'IMAP credentials not set' };
  }

  console.log('[MailPoller] Initial sync: connecting to', imap.host, '(limit:', maxLimit, ')');
  const client = new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: true,
    auth: { user: imap.user, pass: imap.pass },
    logger: false,
  });

  let lock;
  let processed = 0;
  try {
    await client.connect();
    console.log('[MailPoller] Initial sync: connected');
    lock = await client.getMailboxLock('INBOX');
    const total = client.mailbox?.exists ?? 0;
    console.log('[MailPoller] Initial sync: mailbox has', total, 'messages');
    if (total === 0) return { ok: true, processed: 0 };
    const startSeq = Math.max(1, total - maxLimit + 1);
    const range = `${startSeq}:*`;
    const messages = await client.fetchAll(range, { envelope: true, source: true });
    console.log('[MailPoller] Initial sync: fetched', messages.length, 'messages');
    for (const msg of messages) {
      try {
        await processMessage(client, msg);
        processed++;
      } catch (err) {
        console.error('[MailPoller] Initial sync message error:', err.message, err.stack);
      }
    }
    console.log('[MailPoller] Initial sync done, saved', processed, 'tickets');
    return { ok: true, processed };
  } catch (err) {
    console.error('[MailPoller] Initial sync error:', err.message, err.stack);
    return { ok: false, processed: 0, error: err.message };
  } finally {
    if (lock) lock.release();
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
}

/** Realtime: keep IMAP connection open and process new emails as soon as they arrive (like ticket-ingestion-system). */
function runRealtimeWatcher() {
  const { imap } = config;
  if (!imap.user || !imap.pass) return;

  const client = new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: true,
    auth: { user: imap.user, pass: imap.pass },
    logger: false,
  });

  let lock;
  let lastCount = 0;

  client.on('exists', async (data) => {
    if (data.count <= lastCount) return;
    console.log('[MailPoller] New mail detected:', data.count - lastCount, 'new message(s)');
    try {
      const startSeq = lastCount + 1;
      const range = `${startSeq}:*`;
      const messages = await client.fetchAll(range, { envelope: true, source: true });
      for (const msg of messages) {
        try {
          await processMessage(client, msg);
        } catch (err) {
          console.error('[MailPoller] Realtime process error:', err.message);
        }
      }
      lastCount = data.count;
    } catch (err) {
      console.error('[MailPoller] Realtime fetch error:', err.message);
    }
  });

  client.on('close', () => {
    console.log('[MailPoller] Realtime connection closed, reconnecting in 15s...');
    setTimeout(runRealtimeWatcher, 15000);
  });

  client.on('error', (err) => {
    console.error('[MailPoller] Realtime error:', err.message);
  });

  (async () => {
    try {
      await client.connect();
      lock = await client.getMailboxLock('INBOX');
      lastCount = client.mailbox?.exists ?? 0;
      console.log('[MailPoller] Realtime watcher connected, INBOX has', lastCount, 'messages');
      await new Promise(() => {});
    } catch (err) {
      console.error('[MailPoller] Realtime watcher failed:', err.message, '- reconnecting in 15s');
      if (lock) lock.release();
      try { await client.logout(); } catch { client.close(); }
      setTimeout(runRealtimeWatcher, 15000);
    }
  })();
}

export function startMailPoller() {
  if (!config.imap?.user || !config.imap?.pass) return;
  const interval = Math.max(15000, config.mailPollIntervalMs || 45000);

  console.log('[MailPoller] Starting: realtime watcher (new mail as soon as it arrives) + backup poll every', interval / 1000, 's');
  runRealtimeWatcher();
  pollInbox();
  setInterval(pollInbox, interval);
}

/** Check IMAP connection and INBOX message count. Use to verify we can read from the configured email. */
export async function checkInboxConnection() {
  const { imap } = config;
  if (!imap.user || !imap.pass) {
    return { ok: false, email: imap.user || '(not set)', messageCount: null, error: 'IMAP_USER or IMAP_PASS not set' };
  }
  const client = new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: true,
    auth: { user: imap.user, pass: imap.pass },
    logger: false,
  });
  let lock;
  try {
    await client.connect();
    lock = await client.getMailboxLock('INBOX');
    const messageCount = client.mailbox?.exists ?? 0;
    return { ok: true, email: imap.user, messageCount };
  } catch (err) {
    return { ok: false, email: imap.user, messageCount: null, error: err.message };
  } finally {
    if (lock) lock.release();
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
}
