const Settings = require('../models/Settings');

async function getSettingsDoc(userId) {
  let settings = await Settings.findOne({ user: userId });
  if (!settings) {
    settings = await Settings.create({ user: userId });
  }
  return settings;
}

async function get(req, res) {
  const settings = await getSettingsDoc(req.userId);
  res.json(settings);
}

async function update(req, res) {
  const {
    theme,
    colorTheme,
    background,
    sidebarCollapsed,
    notificationChannel,
    remindersMuted,
    notifyOnInvite,
    hidePastEventsByDefault,
    financeDefaultScope,
    activityLogLimit,
  } = req.body;
  const settings = await getSettingsDoc(req.userId);

  if (theme !== undefined) settings.theme = theme;
  if (colorTheme !== undefined) settings.colorTheme = colorTheme;
  if (background !== undefined) settings.background = background;
  if (sidebarCollapsed !== undefined) settings.sidebarCollapsed = sidebarCollapsed;
  if (notificationChannel !== undefined) settings.notificationChannel = notificationChannel;
  if (remindersMuted !== undefined) settings.remindersMuted = remindersMuted;
  if (notifyOnInvite !== undefined) settings.notifyOnInvite = notifyOnInvite;
  if (hidePastEventsByDefault !== undefined) settings.hidePastEventsByDefault = hidePastEventsByDefault;
  if (financeDefaultScope !== undefined) settings.financeDefaultScope = financeDefaultScope;
  if (activityLogLimit !== undefined) settings.activityLogLimit = activityLogLimit;

  await settings.save();
  res.json(settings);
}

module.exports = { get, update };
