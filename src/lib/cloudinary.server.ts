import { v2 as cloudinary } from "cloudinary";

let configured = false;
function ensureConfig() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export async function uploadDataUrl(dataUrl: string, folder = "herbs"): Promise<string> {
  ensureConfig();
  const res = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: "image",
  });
  return res.secure_url;
}

export async function deleteByUrl(url: string) {
  ensureConfig();
  // public id is everything after /upload/ minus version + extension
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
  if (!m) return;
  try {
    await cloudinary.uploader.destroy(m[1]);
  } catch {}
}
