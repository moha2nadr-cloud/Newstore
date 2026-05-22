// Cloudinary auto format/quality + sizing for faster loads.
export function optimizeImage(url: string | null | undefined, width = 600): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (url.includes("/upload/f_") || url.includes("/upload/q_") || url.includes("/upload/w_")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
}
