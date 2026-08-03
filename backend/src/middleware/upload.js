const multer = require("multer");

const MAX_MB = Number(process.env.UPLOAD_MAX_SIZE_MB) || 10;

function fileFilter(_req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Only JPEG, PNG, WEBP or GIF images are allowed"));
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

module.exports = upload;
