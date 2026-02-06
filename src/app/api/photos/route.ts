import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import {
  ensureActiveSession,
  getSessionByToken,
  incrementPhotoCount,
} from "@/lib/sessionStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PhotoPayload = {
  token: string;
  role: "user" | "admin";
  dataUrl: string;
  capturedAt?: string;
};

const toFilename = (capturedAt?: string) => {
  const date = capturedAt ? new Date(capturedAt) : new Date();
  const safe = date
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  return `${safe}.jpg`;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as PhotoPayload;
  if (!body?.token || !body?.dataUrl || !body?.role) {
    return NextResponse.json(
      { ok: false, error: "Missing token, role, or dataUrl" },
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

  if (!ensureActiveSession(session)) {
    return NextResponse.json(
      { ok: false, error: "Expired session" },
      { status: 410 }
    );
  }
  if (body.role !== "user") {
    return NextResponse.json(
      { ok: false, error: "Role not allowed" },
      { status: 403 }
    );
  }
  if (session.status === "ended") {
    return NextResponse.json(
      { ok: false, error: "Session ended" },
      { status: 410 }
    );
  }

  if (!body.dataUrl.startsWith("data:image/")) {
    return NextResponse.json(
      { ok: false, error: "Unsupported image" },
      { status: 400 }
    );
  }

  const [, base64] = body.dataUrl.split(",");
  const buffer = Buffer.from(base64, "base64");

  const dir = path.join(process.cwd(), ".data", "captures", session.id);
  await fs.mkdir(dir, { recursive: true });
  const filename = toFilename(body.capturedAt);
  const filepath = path.join(dir, filename);
  await fs.writeFile(filepath, buffer);

  incrementPhotoCount(session, body.capturedAt);

  return NextResponse.json(
    { ok: true, photoCount: session.photoCount },
    { headers: { "Cache-Control": "no-store" } }
  );
}
