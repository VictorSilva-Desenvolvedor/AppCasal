const { isWhatsappReady, getWhatsappQr } = require('../services/whatsappService');

function getStatus(req, res) {
  const connected = isWhatsappReady();
  res.json({ connected, qr: connected ? null : getWhatsappQr() });
}

module.exports = { getStatus };
