const multer = require("multer");

const MAX_MB = Number(process.env.UPLOAD_MAX_SIZE_MB) || 10;
const AUDIO_MB = Number(process.env.AUDIO_UPLOAD_MAX_SIZE_MB) || 25;

const AUDIO_MIMES = [
  "audio/m4a", "audio/mp4", "audio/x-m4a", "audio/aac",
  "audio/mpeg", "audio/mp3", "audio/webm", "audio/ogg", "audio/wav", "audio/x-wav",
];
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function fileFilter(_req, file, cb) {
  if (IMAGE_MIMES.includes(file.mimetype)) return cb(null, true);
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

const audioUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter(_req, file, cb) {
    if (AUDIO_MIMES.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only M4A, MP3, AAC, OGG, WAV or WEBM audio is allowed"));
  },
  limits: { fileSize: AUDIO_MB * 1024 * 1024 },
});

// Direct-message attachments: one endpoint accepts both photos and voice notes.
const dmMediaUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter(_req, file, cb) {
    if ([...IMAGE_MIMES, ...AUDIO_MIMES].includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only images or audio are allowed"));
  },
  limits: { fileSize: AUDIO_MB * 1024 * 1024 },
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
module.exports.audioUpload = audioUpload;
module.exports.dmMediaUpload = dmMediaUpload;
