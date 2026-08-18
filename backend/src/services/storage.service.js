const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { supabase } = require("../config/supabase");

const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || "teamcal-uploads";
let bucketReady = false;

async function ensureBucket(force = false) {
  if (bucketReady && !force) return;
  const bucketOptions = {
    public: true,
    // Do not impose a second, bucket-level cap. Multer already enforces the
    // configured limit for each upload type, while Supabase's project-wide
    // limit still applies. A shared bucket limit based on the 500 MB video
    // default can exceed the project's plan and leave image uploads stuck on
    // an older, smaller bucket limit.
    fileSizeLimit: null,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "video/mp4", "video/quicktime", "video/webm", "video/x-m4v", "text/vtt", "application/x-subrip", "text/plain"],
  };
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (error || !data) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, bucketOptions);
    if (createError && !/already exists/i.test(createError.message)) throw createError;
    // A concurrent request may have created the bucket after getBucket(). In
    // that case it still needs our limits and MIME types applied.
    if (createError) {
      const { error: updateError } = await supabase.storage.updateBucket(BUCKET, bucketOptions);
      if (updateError) throw updateError;
    }
  } else {
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, bucketOptions);
    if (updateError) throw updateError;
  }
  bucketReady = true;
}

function exceededBucketLimit(error) {
  return /object exceeded maximum allowed size/i.test(error?.message || "");
}

async function uploadObject(objectPath, file, cacheControl) {
  const options = {
    contentType: file.mimetype,
    cacheControl,
    upsert: false,
  };
  let { error } = await supabase.storage.from(BUCKET).upload(objectPath, file.buffer, options);

  // Bucket configuration can be changed outside this process while the local
  // readiness flag remains cached. Refresh it once before rejecting a file
  // that already passed the API's own upload-size validation.
  if (exceededBucketLimit(error)) {
    await ensureBucket(true);
    ({ error } = await supabase.storage.from(BUCKET).upload(objectPath, file.buffer, options));
  }
  if (error) throw error;
}

async function uploadPublicImage(folder, userId, file) {
  if (!file?.buffer) throw new Error("Image buffer is missing");
  await ensureBucket();
  const extension = path.extname(file.originalname || "").toLowerCase() || `.${file.mimetype.split("/")[1] || "jpg"}`;
  const objectPath = `${folder}/${userId}/${randomUUID()}${extension}`;
  await uploadObject(objectPath, file, "31536000");
  return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

async function uploadPublicFile(folder, userId, file) {
  if (!file?.buffer) throw new Error("File buffer is missing");
  await ensureBucket();
  const extension = path.extname(file.originalname || "").toLowerCase() || ".pdf";
  const objectPath = `${folder}/${userId}/${randomUUID()}${extension}`;
  await uploadObject(objectPath, file, "3600");
  return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

module.exports = { uploadPublicImage, uploadPublicFile };
