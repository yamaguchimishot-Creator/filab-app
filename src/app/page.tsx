export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 20px",
        textAlign: "center",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
        background: "#f7f7f5",
        color: "#111",
      }}
    >
      <section style={{ maxWidth: 640 }}>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: "0.08em",
            marginBottom: 16,
          }}
        >
          FIL Remote
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "#555",
            marginBottom: 40,
            lineHeight: 1.8,
          }}
        >
          プロカメラマンが、あなたのスマホで撮影します
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <a
            href="/camera"
            style={{
              padding: "12px 28px",
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 6,
              letterSpacing: "0.04em",
            }}
          >
            撮影をはじめる
          </a>
          <a
            href="/photographer"
            style={{
              padding: "12px 28px",
              border: "1px solid #111",
              color: "#111",
              textDecoration: "none",
              borderRadius: 6,
              letterSpacing: "0.04em",
            }}
          >
            カメラマンとしてログイン
          </a>
        </div>
      </section>
    </main>
  );
}
