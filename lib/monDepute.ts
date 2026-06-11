const STORAGE_KEY = "mon-depute";
export const MON_DEPUTE_EVENT = "mondepute:change";

export type MonDepute = {
  uid: string;
  slug: string;
  prenom: string;
  nom: string;
  setAt: string;
};

export function readMonDepute(): MonDepute | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MonDepute;
  } catch {
    return null;
  }
}

export function writeMonDepute(depute: Omit<MonDepute, "setAt">): void {
  if (typeof window === "undefined") return;
  const payload: MonDepute = { ...depute, setAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(MON_DEPUTE_EVENT));
}

export function clearMonDepute(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(MON_DEPUTE_EVENT));
}
