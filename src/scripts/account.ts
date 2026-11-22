/**
 * Optional Google sign-in and progress sync (Firebase Auth + Firestore).
 * Firebase is loaded only when the visitor clicks "Sign in" or was signed in before,
 * so ordinary page views download no Firebase code.
 *
 * Synced data (Firestore users/{uid}): flashcard boxes, best quiz score, saved pages.
 */
export const KEYS = { flashcards: 'ocm-flashcards-v1', quizBest: 'ocm-quiz-best-v1', saved: 'ocm-saved-v1', signedIn: 'ocm-signed-in' } as const;

export interface SavedPage { path: string; title: string; at: number }

const read = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
};
const write = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
};

export const getSaved = () => read<SavedPage[]>(KEYS.saved, []);
export function toggleSaved(page: Omit<SavedPage, 'at'>): boolean {
  const list = getSaved();
  const i = list.findIndex((p) => p.path === page.path);
  if (i >= 0) list.splice(i, 1);
  else list.unshift({ ...page, at: Date.now() });
  write(KEYS.saved, list);
  notifyProgress();
  return i < 0;
}

/** Pages call this after changing local progress; signed-in users get it synced. */
export const notifyProgress = () => window.dispatchEvent(new CustomEvent('ocm:progress'));

interface Progress { flashcards: Record<string, number>; quizBest: number; saved: SavedPage[] }
const local = (): Progress => ({ flashcards: read(KEYS.flashcards, {}), quizBest: Number(read(KEYS.quizBest, 0)) || 0, saved: getSaved() });
function merge(a: Progress, b: Partial<Progress>): Progress {
  const flashcards = { ...a.flashcards };
  for (const [k, v] of Object.entries(b.flashcards ?? {})) flashcards[k] = Math.max(flashcards[k] ?? 0, v);
  const saved = [...a.saved];
  for (const p of b.saved ?? []) if (!saved.some((s) => s.path === p.path)) saved.push(p);
  saved.sort((x, y) => y.at - x.at);
  return { flashcards, quizBest: Math.max(a.quizBest, b.quizBest ?? 0), saved };
}
const store = (p: Progress) => { write(KEYS.flashcards, p.flashcards); write(KEYS.quizBest, p.quizBest); write(KEYS.saved, p.saved); };

type Config = { apiKey: string; authDomain: string; projectId: string; appId: string };

async function load(config: Config) {
  const [{ initializeApp }, auth, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
  const app = initializeApp(config);
  return { auth: auth.getAuth(app), authMod: auth, db: fs.getFirestore(app), fs };
}

export function initAccount(root: HTMLElement) {
  const config = JSON.parse(root.dataset.config ?? '{}') as Config;
  const button = root.querySelector<HTMLButtonElement>('[data-signin]')!;
  const menu = root.querySelector<HTMLElement>('[data-menu]')!;
  const name = root.querySelector<HTMLElement>('[data-name]')!;
  const signOutBtn = root.querySelector<HTMLButtonElement>('[data-signout]')!;
  let fb: Awaited<ReturnType<typeof load>> | undefined;
  let timer: number | undefined;

  const sync = async (uid: string) => {
    if (!fb) return;
    const ref = fb.fs.doc(fb.db, 'users', uid);
    const snap = await fb.fs.getDoc(ref);
    const merged = merge(local(), (snap.data() as Partial<Progress>) ?? {});
    store(merged);
    await fb.fs.setDoc(ref, { ...merged, updatedAt: fb.fs.serverTimestamp() });
    window.dispatchEvent(new CustomEvent('ocm:synced'));
  };

  const start = async () => {
    fb ??= await load(config);
    fb.authMod.onAuthStateChanged(fb.auth, (user) => {
      if (user) {
        write(KEYS.signedIn, true);
        button.hidden = true;
        menu.hidden = false;
        name.textContent = user.displayName?.split(' ')[0] ?? 'Account';
        sync(user.uid).catch(() => undefined);
      } else {
        try { localStorage.removeItem(KEYS.signedIn); } catch { /* ignore */ }
        button.hidden = false;
        menu.hidden = true;
      }
    });
  };

  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await start();
      await fb!.authMod.signInWithPopup(fb!.auth, new fb!.authMod.GoogleAuthProvider());
    } catch { /* closed popup or blocked */ } finally { button.disabled = false; }
  });
  signOutBtn.addEventListener('click', async () => { if (fb) await fb.authMod.signOut(fb.auth); });
  window.addEventListener('ocm:progress', () => {
    const uid = fb?.auth.currentUser?.uid;
    if (!uid) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => sync(uid).catch(() => undefined), 1500);
  });

  root.hidden = false;
  if (read(KEYS.signedIn, false)) start().catch(() => undefined);
}
