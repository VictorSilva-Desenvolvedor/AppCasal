const ActivityLog = require('../models/ActivityLog');
const Settings = require('../models/Settings');

async function list(req, res) {
  const settings = await Settings.findOne({ user: req.userId });
  const limit = settings?.activityLogLimit || 200;
  const logs = await ActivityLog.find({ team: req.userTeam }).populate('actor', 'name').sort({ createdAt: -1 }).limit(limit);
  res.json(logs);
}

module.exports = { list };
