import crypto from "crypto";

export type SessionStatus = "waiting" | "ready" | "shooting" | "ended";

export type Session = {
  id: string;
  status: SessionStatus;
  createdAt: number;
  expiresAt: number;
  photoCount: number;
  lastCaptureAt?: string;
};

const SESSION_TTL_MS = 60 * 60 * 1000;

const store = globalThis as typeof globalThis & {
  __sessions?: Map<string, Session>;
};

const getSessions = () => {
  if (!store.__sessions) {
    store.__sessions = new Map<string, Session>();
  }
  return store.__sessions;
};

const createToken = () => crypto.randomBytes(16).toString("hex");

export const createSession = () => {
  const id = createToken();
  const now = Date.now();

  const session: Session = {
    id,
    status: "waiting",
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    photoCount: 0,
  };

  getSessions().set(id, session);
  return session;
};

const isExpired = (session: Session) => Date.now() > session.expiresAt;

export const getSessionByToken = (token: string) =>
  getSessions().get(token) ?? null;

export const getSessionById = (id: string) => getSessions().get(id) ?? null;

export const ensureActiveSession = (session: Session) => {
  if (isExpired(session)) {
    return false;
  }
  return true;
};

export const updateSessionStatus = (session: Session, status: SessionStatus) => {
  session.status = status;
  return session;
};

export const incrementPhotoCount = (session: Session, capturedAt?: string) => {
  session.photoCount += 1;
  session.lastCaptureAt = capturedAt ?? new Date().toISOString();
  return session;
};
