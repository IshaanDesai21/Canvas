/**
 * Minimal Google Tasks client.
 *
 * Uses Google Identity Services (GIS) OAuth 2.0 *token* flow (implicit /
 * "token client") — no client secret, no backend. The browser obtains a
 * short-lived access token directly and we call the Tasks REST API with it.
 *
 * Everything here is client-only (the app is a static SPA), so we guard
 * against SSR by checking for `window`/`document`.
 */

import { kv } from '$utils/storage';

/**
 * Paste your OAuth **Web application** client ID here, e.g.
 * "1234567890-abcdefg.apps.googleusercontent.com".
 *
 * Get it from Google Cloud Console → APIs & Services → Credentials →
 * "Create OAuth client ID" → Application type "Web application".
 * The page origin (e.g. http://localhost:5173 or your deployed origin) must
 * be listed under "Authorised JavaScript origins". The Google Tasks API must
 * also be enabled for the project. Leaving this empty keeps the widget in
 * local/offline mode.
 */
export const GOOGLE_CLIENT_ID = '';

const SCOPE = 'https://www.googleapis.com/auth/tasks';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const TASKS_BASE = 'https://tasks.googleapis.com/tasks/v1';

const TOKEN_KEY = 'googleTasks:token';
const LIST_ID_KEY = 'googleTasks:listId';

/** Normalised task shape exposed to the UI. */
export interface GTask {
  id: string;
  title: string;
  done: boolean;
}

interface StoredToken {
  accessToken: string;
  /** epoch ms when the token expires */
  expiresAt: number;
}

/* ---- Minimal GIS / google global typings ----------------------------- */

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (resp: TokenResponse) => void;
  error_callback?: (err: unknown) => void;
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: TokenClientConfig) => TokenClient;
  revoke: (token: string, done?: () => void) => void;
}

interface GoogleNS {
  accounts: { oauth2: GoogleOAuth2 };
}

declare global {
  // eslint-disable-next-line no-var
  var google: GoogleNS | undefined;
}

/* ---- Token state ----------------------------------------------------- */

let token: StoredToken | null = kv.get<StoredToken | null>(TOKEN_KEY, null);
let cachedListId: string | null = kv.get<string | null>(LIST_ID_KEY, null);

function setToken(next: StoredToken | null): void {
  token = next;
  if (next) kv.set(TOKEN_KEY, next);
  else kv.remove(TOKEN_KEY);
}

function currentToken(): string | null {
  if (!token) return null;
  if (Date.now() >= token.expiresAt) {
    setToken(null);
    return null;
  }
  return token.accessToken;
}

/* ---- Public surface -------------------------------------------------- */

/** True when a (non-empty) OAuth client ID has been configured. */
export function googleTasksConfigured(): boolean {
  return GOOGLE_CLIENT_ID.trim().length > 0;
}

/** True when we hold a valid, unexpired access token. */
export function isSignedIn(): boolean {
  return currentToken() !== null;
}

/* ---- GIS script loading --------------------------------------------- */

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Google Tasks is only available in the browser'));
  }
  if (globalThis.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;

  gisPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      // Already injected (possibly mid-load) — wait for it.
      if (globalThis.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null; // allow retry
      reject(new Error('Failed to load Google Identity Services'));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

/* ---- Auth ------------------------------------------------------------ */

let tokenClient: TokenClient | null = null;

/**
 * Trigger the GIS token flow and store the resulting access token.
 * Resolves once a token is obtained, rejects on error / user cancel.
 */
export async function signIn(): Promise<void> {
  if (!googleTasksConfigured()) {
    throw new Error('GOOGLE_CLIENT_ID is not set');
  }
  await loadGis();
  const oauth2 = globalThis.google?.accounts?.oauth2;
  if (!oauth2) throw new Error('Google Identity Services unavailable');

  return new Promise<void>((resolve, reject) => {
    try {
      tokenClient = oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPE,
        callback: (resp) => {
          if (resp.error || !resp.access_token) {
            reject(new Error(resp.error_description || resp.error || 'Authorization failed'));
            return;
          }
          // GIS expires_in is seconds; subtract a small skew margin.
          const expiresInMs = (resp.expires_in ?? 3600) * 1000;
          setToken({ accessToken: resp.access_token, expiresAt: Date.now() + expiresInMs - 30_000 });
          resolve();
        },
        error_callback: (err) => reject(err instanceof Error ? err : new Error('Authorization cancelled'))
      });
      tokenClient.requestAccessToken();
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Authorization failed'));
    }
  });
}

/** Forget the local token (and best-effort revoke it with Google). */
export function signOut(): void {
  const t = currentToken();
  if (t && globalThis.google?.accounts?.oauth2) {
    try {
      globalThis.google.accounts.oauth2.revoke(t);
    } catch {
      /* ignore revoke failures */
    }
  }
  setToken(null);
}

/* ---- REST helpers ---------------------------------------------------- */

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const t = currentToken();
  if (!t) throw new Error('Not signed in');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${t}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(`${TASKS_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    setToken(null);
    throw new Error('Google authorization expired');
  }
  if (!res.ok) {
    throw new Error(`Google Tasks request failed (${res.status})`);
  }
  return res;
}

interface RawTaskList {
  id: string;
  title?: string;
}
interface RawTaskListResponse {
  items?: RawTaskList[];
}
interface RawTask {
  id: string;
  title?: string;
  status?: string;
}
interface RawTaskResponse {
  items?: RawTask[];
}

/** Resolve (and cache) the id of the user's default task list. */
async function getDefaultListId(): Promise<string> {
  if (cachedListId) return cachedListId;
  const res = await authedFetch('/users/@me/lists');
  const data = (await res.json()) as RawTaskListResponse;
  const first = data.items?.[0];
  if (!first) throw new Error('No Google task lists found');
  cachedListId = first.id;
  kv.set(LIST_ID_KEY, cachedListId);
  return cachedListId;
}

/* ---- Tasks API ------------------------------------------------------- */

/** Fetch tasks from the default list (including completed). */
export async function listTasks(): Promise<GTask[]> {
  const listId = await getDefaultListId();
  const res = await authedFetch(`/lists/${encodeURIComponent(listId)}/tasks?showCompleted=true&showHidden=true`);
  const data = (await res.json()) as RawTaskResponse;
  return (data.items ?? []).map((t) => ({
    id: t.id,
    title: t.title ?? '',
    done: t.status === 'completed'
  }));
}

/** Create a new task in the default list. */
export async function addTask(title: string): Promise<GTask> {
  const trimmed = title.trim();
  if (!trimmed) throw new Error('Task title is empty');
  const listId = await getDefaultListId();
  const res = await authedFetch(`/lists/${encodeURIComponent(listId)}/tasks`, {
    method: 'POST',
    body: JSON.stringify({ title: trimmed })
  });
  const t = (await res.json()) as RawTask;
  return { id: t.id, title: t.title ?? trimmed, done: t.status === 'completed' };
}

/** Toggle a task's completion status. */
export async function toggleTask(id: string, done: boolean): Promise<void> {
  const listId = await getDefaultListId();
  await authedFetch(`/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: done ? 'completed' : 'needsAction' })
  });
}
