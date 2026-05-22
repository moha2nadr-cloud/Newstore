import { useSyncExternalStore } from "react";

export type CartItem = { id: number; name: string; price?: number | null; currency?: string | null; image?: string | null };

const KEY = "herb_cart_v1";

type State = { items: CartItem[] };
const listeners = new Set<() => void>();
let state: State = { items: [] };
const EMPTY: State = { items: [] };
let initialized = false;

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { items: JSON.parse(raw) };
  } catch {}
  initialized = true;
}
function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state.items));
}
function emit() { listeners.forEach((l) => l()); }

function subscribe(cb: () => void) {
  if (!initialized) load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const getSnap = () => state;
const getServerSnap = () => EMPTY;

export function useCart() {
  const snap = useSyncExternalStore(subscribe, getSnap, getServerSnap);
  return {
    items: snap.items,
    addItem: (item: CartItem) => {
      if (state.items.some((i) => i.id === item.id)) return;
      state = { items: [...state.items, item] };
      persist(); emit();
    },
    removeItem: (id: number) => {
      state = { items: state.items.filter((i) => i.id !== id) };
      persist(); emit();
    },
    has: (id: number) => state.items.some((i) => i.id === id),
    clear: () => { state = { items: [] }; persist(); emit(); },
  };
}
