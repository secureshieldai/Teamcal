const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { supabase } = require("../config/supabase");

const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || "teamcal-uploads";
let bucketReady = false;

async function ensureBucket() {
  if (bucketReady) return;
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (error || !data) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: `${Number(process.env.UPLOAD_MAX_SIZE_MB) || 10}MB`,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    });
    if (createError && !/already exists/i.test(createError.message)) throw createError;
  } else if (!data.public) {
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, { public: true });
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

module.exports = { uploadPublicImage };
