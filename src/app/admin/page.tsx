"use client";

import { useState } from "react";

type SessionCreateResponse = {
  ok: boolean;
  sessionId: string;
  userUrl: string;
  adminUrl: string;
  expiresAt: number;
};

export default function AdminLandingPage() {
  const [sessionInfo, setSessionInfo] = useState<SessionCreateResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const createSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        cache: "no-store",
      });
      const data = (await res.json()) as SessionCreateResponse;
      if (data.ok) {
        setSessionInfo(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-12">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Session Creator
          </p>
          <h1 className="text-2xl font-semibold">撮影セッション作成</h1>
          <p className="text-sm text-zinc-600">
            予約メールに貼り付けるURLを発行します。
          </p>
        </header>

        <button
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
          onClick={createSession}
          disabled={isLoading || !!sessionInfo}
        >
          Generate URL
        </button>

        <p className="text-xs text-zinc-500">
          Booklyメール用のURL発行は{" "}
          <a className="text-zinc-900 underline" href="/admin/bookly">
            こちら
          </a>
        </p>

        {sessionInfo && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="break-all text-sm font-semibold text-zinc-900">
              Session ID: {sessionInfo.sessionId}
            </p>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">ユーザー用URL</p>
              <p className="mt-1 break-all text-sm font-semibold text-zinc-900">
                {sessionInfo.userUrl}
              </p>
              <p className="mt-4 text-xs text-zinc-500">管理用URL</p>
              <p className="mt-1 break-all text-sm font-semibold text-zinc-900">
                {sessionInfo.adminUrl}
              </p>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              有効期限:{" "}
              {new Date(sessionInfo.expiresAt).toLocaleString("ja-JP")}
            </p>

            <button
              className="mt-4 w-full rounded-full border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
              onClick={() => {
                setSessionInfo(null);
                void createSession();
              }}
              disabled={isLoading}
            >
              Create NEW session (warning)
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
