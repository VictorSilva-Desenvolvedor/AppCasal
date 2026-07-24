const ActivityLog = require('../models/ActivityLog');
const Settings = require('../models/Settings');

async function list(req, res) {
  const settings = await Settings.findOne({ user: req.userId });
  const limit = settings?.activityLogLimit || 200;
  const filter = { team: req.userTeam };
  if (req.query.actor) filter.actor = req.query.actor;
  const logs = await ActivityLog.find(filter).populate('actor', 'name').sort({ createdAt: -1 }).limit(limit);
  res.json(logs);
}

module.exports = { list };
