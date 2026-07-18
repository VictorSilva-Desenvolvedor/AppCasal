const { uploadBuffer } = require('../config/storage');

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado' });
  }

  const result = await uploadBuffer(req.file.buffer, req.file.originalname);

  res.status(201).json({
    url: result.secure_url,
    name: req.file.originalname,
    mimetype: req.file.mimetype,
  });
}

module.exports = { uploadFile };
