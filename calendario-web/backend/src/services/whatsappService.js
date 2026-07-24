const path = require('path');
const pino = require('pino');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const SESSION_DIR = path.join(__dirname, '..', '..', 'whatsapp-session');
const QR_IMAGE_PATH = path.join(__dirname, '..', '..', 'whatsapp-qr.png');

let sock = null;
let ready = false;
let startingPromise = null;
let lastQrDataUrl = null;

async function startWhatsapp() {
  if (startingPromise) return startingPromise;

  startingPromise = (async () => {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    sock = makeWASocket({ auth: state, logger: pino({ level: 'silent' }) });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('Escaneie o QR code abaixo com o WhatsApp de +55 62998035936:');
        qrcodeTerminal.generate(qr, { small: true });
        QRCode.toFile(QR_IMAGE_PATH, qr, { width: 400 })
          .then(() => console.log(`QR code também salvo como imagem em: ${QR_IMAGE_PATH}`))
          .catch((err) => console.error('Falha ao salvar QR code como imagem:', err.message));
        QRCode.toDataURL(qr)
          .then((dataUrl) => { lastQrDataUrl = dataUrl; })
          .catch((err) => console.error('Falha ao gerar QR code em data URL:', err.message));
      }

      if (connection === 'open') {
        ready = true;
        lastQrDataUrl = null;
        console.log('WhatsApp conectado.');
      }

      if (connection === 'close') {
        ready = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        if (loggedOut) {
          console.error(
            'Sessão do WhatsApp deslogada. Apague a pasta whatsapp-session e reinicie o servidor para escanear um novo QR.'
          );
        } else {
          console.error('Conexão com WhatsApp caiu (status', statusCode, '). Reconectando...');
          startingPromise = null;
          startWhatsapp().catch((err) => console.error('Falha ao reconectar WhatsApp:', err.message));
        }
      }
    });
  })();

  return startingPromise;
}

function isWhatsappReady() {
  return ready;
}

function getWhatsappQr() {
  return lastQrDataUrl;
}

function normalizeToJid(rawNumber) {
  let digits = String(rawNumber || '').replace(/\D/g, '');
  if (!digits) return null;
  if (!digits.startsWith('55')) digits = `55${digits}`;
  return `${digits}@s.whatsapp.net`;
}

async function sendWhatsappMessage(rawNumber, text) {
  try {
    const jid = normalizeToJid(rawNumber);
    if (!jid) {
      console.error('Número de WhatsApp ausente/inválido, destinatário ignorado:', rawNumber);
      return false;
    }
    if (!sock || !ready) {
      console.error('WhatsApp não está conectado; mensagem não enviada para', rawNumber);
      return false;
    }
    await sock.sendMessage(jid, { text });
    return true;
  } catch (err) {
    console.error('Falha ao enviar WhatsApp para', rawNumber, ':', err.message);
    return false;
  }
}

module.exports = { startWhatsapp, isWhatsappReady, getWhatsappQr, sendWhatsappMessage };
