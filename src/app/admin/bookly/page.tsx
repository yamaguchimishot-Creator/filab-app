"use client";

import { useState } from "react";

type BooklyResponse = {
  ok: boolean;
  sessionId: string;
  userUrl: string;
  adminUrl: string;
  expiresAt: number;
  emailText: string;
};

export default function BooklyEmailPage() {
  const [result, setResult] = useState<BooklyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bookly", {
        method: "POST",
        cache: "no-store",
      });
      const data = (await res.json()) as BooklyResponse;
      if (data.ok) {
        setResult(data);
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
            Bookly Email
          </p>
          <h1 className="text-2xl font-semibold">Booklyメール用URL発行</h1>
          <p className="text-sm text-zinc-600">
            予約確定メールに貼り付ける撮影開始URLを生成します。
          </p>
        </header>

        <button
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
          onClick={generate}
          disabled={isLoading || !!result}
        >
          Generate URL
        </button>

        {result && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="break-all text-sm font-semibold text-zinc-900">
              Session ID: {result.sessionId}
            </p>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs text-zinc-500">ユーザー用URL</p>
              <p className="mt-1 break-all text-sm font-semibold text-zinc-900">
                {result.userUrl}
              </p>

              <p className="mt-4 text-xs text-zinc-500">管理用URL</p>
              <p className="mt-1 break-all text-sm font-semibold text-zinc-900">
                {result.adminUrl}
              </p>
            </div>

            <p className="mt-4 text-xs text-zinc-500">メール本文例</p>
            <textarea
              className="mt-2 h-28 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700"
              value={result.emailText}
              readOnly
            />

            <p className="mt-3 text-xs text-zinc-500">
              有効期限:{" "}
              {new Date(result.expiresAt).toLocaleString("ja-JP")}
            </p>

            <button
              className="mt-4 w-full rounded-full border border-rose-200 px-5 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
              onClick={() => {
                setResult(null);
                void generate();
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
