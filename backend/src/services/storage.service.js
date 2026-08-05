const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { supabase } = require("../config/supabase");

const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || "teamcal-uploads";
let bucketReady = false;

async function ensureBucket() {
  if (bucketReady) return;
  const bucketOptions = {
    public: true,
    fileSizeLimit: `${Math.max(Number(process.env.UPLOAD_MAX_SIZE_MB) || 10, Number(process.env.PDF_UPLOAD_MAX_SIZE_MB) || 100, Number(process.env.VIDEO_UPLOAD_MAX_SIZE_MB) || 500)}MB`,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "video/mp4", "video/quicktime", "video/webm", "video/x-m4v", "text/vtt", "application/x-subrip", "text/plain"],
  };
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (error || !data) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, bucketOptions);
    if (createError && !/already exists/i.test(createError.message)) throw createError;
  } else {
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, bucketOptions);
    if (updateError) throw updateError;
  }
  bucketReady = true;
}

async function uploadPublicImage(folder, userId, file) {
  if (!file?.buffer) throw new Error("Image buffer is missing");
  await ensureBucket();
  const extension = path.extname(file.originalname || "").toLowerCase() || `.${file.mimetype.split("/")[1] || "jpg"}`;
  const objectPath = `${folder}/${userId}/${randomUUID()}${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

async function uploadPublicFile(folder, userId, file) {
  if (!file?.buffer) throw new Error("File buffer is missing");
  await ensureBucket();
  const extension = path.extname(file.originalname || "").toLowerCase() || ".pdf";
  const objectPath = `${folder}/${userId}/${randomUUID()}${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

module.exports = { uploadPublicImage, uploadPublicFile };
