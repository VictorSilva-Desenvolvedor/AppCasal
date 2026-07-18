const multer = require('multer');
const path = require('path');

const allowedExt = /jpeg|jpg|png|webp|gif|pdf|doc|docx|xls|xlsx|txt/;
const allowedMime =
  /^image\/(jpeg|png|webp|gif)$|^application\/pdf$|^application\/msword$|^application\/vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet)$|^application\/vnd\.ms-excel$|^text\/plain$/;

function fileFilter(req, file, cb) {
  const validExt = allowedExt.test(path.extname(file.originalname).toLowerCase());
  const validMime = allowedMime.test(file.mimetype);

  if (validExt && validMime) {
    return cb(null, true);
  }
  cb(new Error('Tipo de arquivo não permitido (use imagens, PDF, doc/docx, xls/xlsx ou txt)'));
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
