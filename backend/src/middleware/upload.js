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

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter(_req, file, cb) {
    if (file.mimetype === "application/pdf") return cb(null, true);
    cb(new Error("Only PDF documents are allowed"));
  },
  limits: { fileSize: (Number(process.env.PDF_UPLOAD_MAX_SIZE_MB) || 100) * 1024 * 1024 },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter(_req, file, cb) {
    const allowed = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v", "text/vtt", "application/x-subrip", "text/plain"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only MP4, MOV, WebM, VTT, SRT or transcript files are allowed"));
  },
  limits: { fileSize: (Number(process.env.VIDEO_UPLOAD_MAX_SIZE_MB) || 500) * 1024 * 1024 },
});

module.exports = upload;
module.exports.pdfUpload = pdfUpload;
module.exports.videoUpload = videoUpload;
