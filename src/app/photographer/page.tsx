export default function PhotographerPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">
            Photographer Control Panel
          </h1>
          <p className="text-sm text-zinc-600">
            PC向けのシンプルな管理画面です。
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs text-zinc-500">Session ID</p>
          <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900">
            未設定
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800">
              接続する
            </button>
            <button className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300">
              シャッター
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
