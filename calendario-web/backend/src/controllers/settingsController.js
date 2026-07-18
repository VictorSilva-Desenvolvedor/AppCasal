const Settings = require('../models/Settings');

async function getSettingsDoc() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

async function get(req, res) {
  const settings = await getSettingsDoc();
  res.json(settings);
}

async function update(req, res) {
  const { theme, colorTheme, background } = req.body;
  const settings = await getSettingsDoc();

  if (theme !== undefined) settings.theme = theme;
  if (colorTheme !== undefined) settings.colorTheme = colorTheme;
  if (background !== undefined) settings.background = background;

  await settings.save();
  res.json(settings);
}

module.exports = { get, update };
