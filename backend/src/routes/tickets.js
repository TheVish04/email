import express from 'express';
import { Ticket } from '../models/Ticket.js';
import { ReviewItem } from '../models/ReviewItem.js';
import { classifyEmail, summarizeEmails, generateBroadcastDraft } from '../services/groq.js';
import { initialSyncInbox, checkInboxConnection } from '../services/mailPoller.js';
import { sendEmail } from '../services/mailSender.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

const ROLES_SEE_ALL = ['Admin', 'Manager'];

function departmentFilter(req) {
  if (ROLES_SEE_ALL.includes(req.user?.role)) return {};
  return { department: req.user?.role || '' };
}

/** Check if we can connect to the configured inbox (mailmitra93@gmail.com). Returns { ok, email, messageCount, error? }. */
router.get('/inbox-status', async (req, res) => {
  try {
    const result = await checkInboxConnection();
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, email: null, messageCount: null, error: err.message });
  }
});

/** Manually trigger inbox sync (fetch last N emails, classify, save). Query/body: limit (default 100, max 300). */
router.post('/poll-now', async (req, res) => {
  try {
    const limit = req.query.limit ?? req.body?.limit ?? 100;
    const result = await initialSyncInbox(limit);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, processed: 0, error: err.message });
  }
});

router.post('/classify', async (req, res) => {
  try {
    const { subject, body } = req.body;
    const title = req.body.title ?? subject;
    const description = req.body.description ?? body;
    const sub = title || subject || '';
    const b = description || body || '';
    if (!sub && !b) {
      return res.status(400).json({ error: 'Subject or body required' });
    }
    const result = await classifyEmail(sub, b);
    const minConfidence = Math.min(result.confidenceDepartment, result.confidencePriority);
    const needsReview = minConfidence < 0.8;

    const ticket = await Ticket.create({
      subject: sub,
      body: b.slice(0, 5000),
      sender: req.body.sender || '',
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
      source: req.body.source || 'external',
      userId: req.user._id,
    });

    if (needsReview) {
      await ReviewItem.create({ ticketId: ticket._id, userId: req.user._id });
    }

    res.status(201).json({
      ...result,
      ticketId: ticket._id,
      needsReview,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Classification failed' });
  }
});

router.get('/tickets', async (req, res) => {
  try {
    const { intensity, sentiment, department, limit = 50, search, myTickets } = req.query;
    const filter = { ...departmentFilter(req) };
    if (intensity && intensity !== 'All') filter.intensity = intensity;
    if (sentiment && sentiment !== 'All') filter.sentiment = sentiment;
    if (department && department !== 'All' && ROLES_SEE_ALL.includes(req.user?.role)) filter.department = department;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ subject: regex }, { body: regex }];
    }

    if (myTickets === 'true') {
      // Assuming tickets have a userId field representing assignment or ownership. 
      // If the schema uses a different field for assignment, this should be updated.
      // Based on create ticket: userId is set to req.user._id (the creator). 
      // If 'my tickets' means 'assigned to me', we might need an 'assignedTo' field.
      // For now, filtering by creator/owner (userId) or we can fallback to department if no assignment exists.
      // Let's assume strict userId filtering for "My Tickets".
      filter.userId = req.user._id;
    }

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .lean();
    res.json({ tickets });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch tickets' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const baseMatch = departmentFilter(req);

    const matchMonth = { ...baseMatch, createdAt: { $gte: startOfMonth } };
    const matchUnseen = { ...baseMatch, seen: false };
    const matchOpen = { ...baseMatch, status: 'open' };
    const matchClosed = { ...baseMatch, status: 'closed' };
    const matchYear = { ...baseMatch, createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) } };

    const [totalThisMonth, unseenCount, openCount, closedCount, priorityBreakdown, monthByMonth] = await Promise.all([
      Ticket.countDocuments(matchMonth),
      Ticket.countDocuments(matchUnseen),
      Ticket.countDocuments(matchOpen),
      Ticket.countDocuments(matchClosed),
      Ticket.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$intensity', count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: matchYear },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const breakdown = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    priorityBreakdown.forEach(({ _id, count }) => {
      if (_id in breakdown) breakdown[_id] = count;
    });
    const total = breakdown.critical + breakdown.high + breakdown.medium + breakdown.low;
    const heatmap = total
      ? {
        critical: { count: breakdown.critical, pct: Math.round((breakdown.critical / total) * 100) },
        high: { count: breakdown.high, pct: Math.round((breakdown.high / total) * 100) },
        medium: { count: breakdown.medium, pct: Math.round((breakdown.medium / total) * 100) },
        low: { count: breakdown.low, pct: Math.round((breakdown.low / total) * 100) },
      }
      : { critical: { count: 0, pct: 0 }, high: { count: 0, pct: 0 }, medium: { count: 0, pct: 0 }, low: { count: 0, pct: 0 } };

    res.json({
      totalThisMonth,
      unseenCount,
      openCount,
      closedCount,
      heatmap,
      monthByMonth: monthByMonth.map(({ _id, count }) => ({ year: _id.year, month: _id.month, count })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch stats' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const filter = { ...departmentFilter(req), seen: false };
    const unseen = await Ticket.find(filter).sort({ createdAt: -1 }).limit(20).select('subject body').lean();
    const texts = unseen.map((t) => `${t.subject}\n${t.body}`).filter(Boolean);
    const summary = await summarizeEmails(texts);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Summary failed' });
  }
});

router.post('/review', async (req, res) => {
  try {
    const { ticketId, confirmed, correctedDepartment, correctedPriority } = req.body;
    if (!ticketId) return res.status(400).json({ error: 'ticketId required' });
    const item = await ReviewItem.findOne({ ticketId, resolved: false });
    if (!item) return res.status(404).json({ error: 'Review item not found' });
    if (confirmed) {
      item.resolved = true;
      await item.save();
      return res.json({ ok: true, message: 'Confirmed' });
    }
    if (correctedDepartment || correctedPriority) {
      const update = {};
      if (correctedDepartment) update.department = correctedDepartment;
      if (correctedPriority) {
        update.priority = correctedPriority;
        const intensityMap = { P0: 'critical', P1: 'high', P2: 'medium', P3: 'low' };
        update.intensity = intensityMap[correctedPriority] || 'medium';
      }
      await Ticket.findByIdAndUpdate(ticketId, update);
      item.resolved = true;
      item.correctedDepartment = correctedDepartment || undefined;
      item.correctedPriority = correctedPriority || undefined;
      item.userId = req.user._id;
      await item.save();
    }
    res.json({ ok: true, message: 'Correction saved' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Review failed' });
  }
});

router.get('/review', async (req, res) => {
  try {
    const deptFilter = departmentFilter(req);
    const items = await ReviewItem.find({ resolved: false })
      .populate('ticketId')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const filtered = items
      .map((i) => ({ ...i, ticket: i.ticketId }))
      .filter((i) => i.ticket && (Object.keys(deptFilter).length === 0 || i.ticket.department === deptFilter.department));
    res.json({ items: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch review queue' });
  }
});

router.patch('/tickets/:id/seen', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    const deptFilter = departmentFilter(req);
    if (Object.keys(deptFilter).length > 0 && ticket.department !== deptFilter.department) {
      return res.status(403).json({ error: 'Ticket belongs to another department' });
    }
    ticket.seen = true;
    await ticket.save();
    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Update failed' });
  }
});

router.post('/bulk-draft', async (req, res) => {
  try {
    const { subject, ticketIds } = req.body;
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ error: 'No tickets selected' });
    }
    // Fetch bodies
    const tickets = await Ticket.find({ _id: { $in: ticketIds } }).select('body').limit(10).lean();
    const texts = tickets.map(t => t.body).filter(Boolean);

    // Generate draft
    const draft = await generateBroadcastDraft(subject || 'Legacy Issue', texts);
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Draft generation failed' });
  }
});

router.post('/bulk-send', async (req, res) => {
  try {
    const { ticketIds, replyBody } = req.body;
    if (!ticketIds || !Array.isArray(ticketIds)) return res.status(400).json({ error: 'Invalid tickets' });
    if (!replyBody) return res.status(400).json({ error: 'Reply body empty' });

    // Send emails
    const tickets = await Ticket.find({ _id: { $in: ticketIds } }).select('sender subject');
    let sentCount = 0;

    for (const t of tickets) {
      if (t.sender && t.sender.includes('@')) {
        try {
          await sendEmail({
            to: t.sender,
            subject: `Re: ${t.subject}`,
            text: replyBody,
          });
          sentCount++;
        } catch (e) {
          console.error(`[BulkSend] Failed to send to ${t.sender}:`, e.message);
        }
      }
    }

    // Mark as closed
    if (sentCount > 0) {
      await Ticket.updateMany({ _id: { $in: ticketIds } }, { status: 'closed' });
    }

    res.json({ ok: true, sentCount });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Bulk send failed' });
  }
});

export default router;
