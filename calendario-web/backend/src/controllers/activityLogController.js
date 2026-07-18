const ActivityLog = require('../models/ActivityLog');

async function list(req, res) {
  const logs = await ActivityLog.find().populate('actor', 'name').sort({ createdAt: -1 }).limit(200);
  res.json(logs);
}

module.exports = { list };
