export default function CameraPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold">
          あなたのスマホが、撮影スタジオになります
        </h1>
        <p className="text-sm text-zinc-600 leading-relaxed">
          この撮影は、プロカメラマンがあなたのスマートフォンを遠隔操作して行います。
          難しい操作は不要です。指示に従うだけで撮影できます。
        </p>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
          カメラマン接続待ち
        </div>

        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500">
          撮影中はこの表示が「撮影中」に切り替わります
        </div>
      </main>
    </div>
  );
}
