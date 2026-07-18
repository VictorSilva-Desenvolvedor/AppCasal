function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado' });
  }

  res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    name: req.file.originalname,
    mimetype: req.file.mimetype,
  });
}

module.exports = { uploadFile };
