import { NextResponse } from "next/server";
import { createSession } from "@/lib/sessionStore";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = createSession();

  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ??
    process.env.APP_ORIGIN ??
    "http://localhost:3000";

  const userUrl = `${origin}/s/${session.id}`;
  const adminUrl = `${origin}/admin/${session.id}`;

  const emailText = [
    "撮影開始URL",
    userUrl,
    "",
    "このURLをスマホで開いてください。",
  ].join("\n");

  return NextResponse.json(
    {
      ok: true,
      sessionId: session.id,
      userUrl,
      adminUrl,
      expiresAt: session.expiresAt,
      emailText,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
