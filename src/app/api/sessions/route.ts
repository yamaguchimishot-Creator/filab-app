import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  ensureActiveSession,
  getSessionByToken,
  incrementPhotoCount,
  SessionStatus,
  updateSessionStatus,
} from "@/lib/sessionStore";

export const dynamic = "force-dynamic";

type PatchPayload = {
  token: string;
  role: "user" | "admin";
  status?: SessionStatus;
  incrementPhoto?: boolean;
  capturedAt?: string;
};

export async function POST(req: NextRequest) {
  const session = createSession();
  const origin = req.nextUrl.origin;

  return NextResponse.json(
    {
      ok: true,
      sessionId: session.id,
      userUrl: `${origin}/s/${session.id}`,
      adminUrl: `${origin}/admin/${session.id}`,
      expiresAt: session.expiresAt,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const role = searchParams.get("role") as "user" | "admin" | null;

  if (!token || !role) {
    return NextResponse.json(
      { ok: false, error: "Missing token or role" },
      { status: 400 }
    );
  }

  const session = getSessionByToken(token);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Invalid token" },
      { status: 404 }
    );
  }

  if (!ensureActiveSession(session)) {
    return NextResponse.json(
      { ok: false, error: "Expired session" },
      { status: 410 }
    );
  }
  if (role === "user" && session.status === "ended") {
    return NextResponse.json(
      { ok: false, error: "Session ended" },
      { status: 410 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      role,
      session: {
        id: session.id,
        status: session.status,
        photoCount: session.photoCount,
        lastCaptureAt: session.lastCaptureAt ?? null,
        expiresAt: session.expiresAt,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as PatchPayload;
  if (!body?.token || !body?.role) {
    return NextResponse.json(
      { ok: false, error: "Missing token or role" },
      { status: 400 }
    );
  }

  const session = getSessionByToken(body.token);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Invalid token" },
      { status: 404 }
    );
  }

  const role = body.role;
  if (!ensureActiveSession(session)) {
    return NextResponse.json(
      { ok: false, error: "Expired session" },
      { status: 410 }
    );
  }
  if (role === "user" && session.status === "ended") {
    return NextResponse.json(
      { ok: false, error: "Session ended" },
      { status: 410 }
    );
  }

  if (body.status) {
    const nextStatus = body.status;
    const allowed =
      (role === "user" && nextStatus === "ready") ||
      (role === "admin" &&
        (nextStatus === "waiting" ||
          nextStatus === "shooting" ||
          nextStatus === "ended"));

    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Status not allowed" },
        { status: 403 }
      );
    }
    updateSessionStatus(session, nextStatus);
  }

  if (body.incrementPhoto && role === "admin") {
    incrementPhotoCount(session, body.capturedAt);
  }

  return NextResponse.json(
    { ok: true, status: session.status, photoCount: session.photoCount },
    { headers: { "Cache-Control": "no-store" } }
  );
}
