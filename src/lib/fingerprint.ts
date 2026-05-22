const KEY = "herb_fp_v1";

export function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  let fp = localStorage.getItem(KEY);
  if (!fp) {
    fp =
      crypto.randomUUID?.() ||
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, fp);
  }
  return fp;
}

const NAME_KEY = "herb_user_name_v1";
export function getStoredName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NAME_KEY) || "";
}
export function setStoredName(n: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, n);
}
