"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";

export default function PhotoDataPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsSubmitted(true);
        form.reset();
      } else {
        console.error(await res.text());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ padding: "60px 24px", maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 16 }}>
        あなたのスマートフォンを、
        <br />
        プロカメラマンのカメラに。
      </h1>

      <p style={{ color: "#555", lineHeight: 1.9, marginBottom: 16 }}>
        全国どこからでも。
        カメラマンが遠隔でシャッターを切り、
        あなたの部屋で“プロ品質の一枚”を撮影します。
      </p>

      <p style={{ color: "#666", fontSize: 14, lineHeight: 1.9, marginBottom: 20 }}>
        ✔ 特別な機材・アプリ不要
        <br />
        ✔ スマホ1台・自宅で完結
        <br />
        ✔ プロが構図・表情・光をリアルタイム指示
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <a
          href="#contact"
          style={{
            display: "inline-block",
            padding: "12px 22px",
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 6,
          }}
        >
          撮影を相談する（無料）
        </a>
        <a
          href="/photos/photo1.jpg"
          style={{ color: "#555", textDecoration: "none", fontSize: 14 }}
        >
          撮影サンプルを見る →
        </a>
      </div>

      <section style={{ marginBottom: 32 }}>
        <ul style={{ lineHeight: 2 }}>
          <li>📸 プロカメラマンがあなたのスマホカメラを遠隔操作して撮影</li>
          <li>🏠 自宅・オフィスなど好きな場所で撮影可能</li>
          <li>💬 撮影中はリアルタイムでポージング・表情を指示</li>
          <li>🖼 撮影後、セレクトされた写真データをオンラインで納品</li>
          <li>🔐 データは安全に管理・提供されます</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <p style={{ lineHeight: 1.9 }}>
          撮影された写真は、
          色補正・明るさ調整を施した高品質データとしてお渡しします。
        </p>
        <p style={{ lineHeight: 1.9, marginTop: 8 }}>
          プロフィール写真、ビジネス用途、記念写真など、
          幅広い用途にご利用いただけます。
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <Image src="/photos/photo1.jpg" alt="" width={300} height={200} />
        <Image src="/photos/photo2.jpg" alt="" width={300} height={200} />
        <Image src="/photos/photo3.jpg" alt="" width={300} height={200} />
      </section>

      <section
        style={{
          background: "#fafafa",
          padding: "32px 20px",
          marginBottom: 32,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              height: 1,
              background: "#e5e5e5",
              marginBottom: 12,
            }}
          />
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            撮影の流れ（3ステップ）
          </h2>
          <div
            style={{
              height: 1,
              background: "#e5e5e5",
              marginTop: 12,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ flex: "1 1 240px" }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>
              ① STEP 1｜スマートフォンをセット
            </p>
            <p style={{ lineHeight: 1.9 }}>
              お手持ちのスマートフォンを、
              カメラマンの案内に従って撮影位置にセットします。
              （三脚がなくても問題ありません）
            </p>
          </div>
          <div style={{ flex: "1 1 240px" }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>
              ② STEP 2｜プロが遠隔で撮影
            </p>
            <p style={{ lineHeight: 1.9 }}>
              撮影中はプロカメラマンがリアルタイムで画面を確認し、
              シャッター操作・構図・表情・ポーズをすべて指示・コントロールします。
              あなたは、指示に従うだけで大丈夫です。
            </p>
          </div>
          <div style={{ flex: "1 1 240px" }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>
              ③ STEP 3｜写真データをオンライン納品
            </p>
            <p style={{ lineHeight: 1.9 }}>
              撮影後、セレクトされた写真を
              色補正・明るさ調整済みの高品質データとしてオンラインで納品します。
              全国どこからでも、スタジオ品質の写真をお受け取りいただけます。
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          borderTop: "1px solid #ddd",
          paddingTop: 24,
          marginBottom: 32,
        }}
      >
        <p style={{ fontSize: 14, color: "#777", marginBottom: 8 }}>
          写真データ販売価格
        </p>
        <p style={{ fontSize: 24, fontWeight: 600 }}>
          データー納品:¥15.000(税込）
        </p>
        <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
          （修正済み5カット納品）
        </p>
        <p style={{ marginTop: 12, color: "#666", fontSize: 14 }}>
          ※ 表示されているサンプル写真は、実際の撮影品質イメージです
        </p>
        <p style={{ color: "#666", fontSize: 14 }}>
          ※ 商用利用をご希望の場合は別途ご相談ください
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
          よくある質問
        </h2>

        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>
              Q1. 本当にスマートフォンだけで大丈夫ですか？
            </p>
            <p style={{ lineHeight: 1.9 }}>
              はい、問題ありません。
              お手持ちのスマートフォンのカメラ性能を最大限に活かし、
              プロカメラマンが構図・ライティング・表情を遠隔で細かく指示・調整します。
            </p>
            <p style={{ lineHeight: 1.9, marginTop: 8 }}>
              特別な機材やアプリの購入は不要です。
            </p>
          </div>

          <div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>
              Q2. 撮影が初めてでも大丈夫ですか？
            </p>
            <p style={{ lineHeight: 1.9 }}>
              もちろん大丈夫です。
              撮影中はカメラマンが常に画面を確認しながら、
              立ち位置・姿勢・目線・表情まで一つひとつ丁寧に案内します。
            </p>
            <p style={{ lineHeight: 1.9, marginTop: 8 }}>
              「写真が苦手」という方ほど、仕上がりに満足いただいています。
            </p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <p style={{ marginBottom: 8 }}>
          撮影内容やご利用用途に不安がある方は、
          まずはお気軽にお問い合わせください。
        </p>
        <p style={{ marginBottom: 16 }}>▶ 下記フォームよりご連絡ください</p>
      </section>

      <section id="contact" style={{ marginBottom: 40 }}>
        {isSubmitted ? (
          <p style={{ color: "#166534" }}>
            送信が完了しました。後ほどご連絡いたします。
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <input
              name="name"
              placeholder="お名前"
              required
              style={{ padding: "10px 12px", border: "1px solid #ccc" }}
            />
            <input
              name="email"
              type="email"
              placeholder="メールアドレス"
              required
              style={{ padding: "10px 12px", border: "1px solid #ccc" }}
            />
            <textarea
              name="message"
              placeholder="お問い合わせ内容"
              rows={5}
              required
              style={{ padding: "10px 12px", border: "1px solid #ccc" }}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "12px 18px",
                background: "#111",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              写真データについて問い合わせる
            </button>
          </form>
        )}
      </section>

      <section style={{ color: "#555", lineHeight: 1.9 }}>
        「移動しなくても、プロ品質。」
        <br />
        FILAB Remote Capture は、
        これからの写真撮影の新しいスタンダードを目指しています。
      </section>
    </main>
  );
}
