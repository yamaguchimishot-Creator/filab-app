"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getSignals, postSignal, resetRoom } from "@/lib/signaling";

type SessionStatus = "waiting" | "ready" | "shooting" | "ended";

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
};

export default function AdminSessionPage() {
  const { token } = useParams<{ token: string }>();
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<SessionStatus>("waiting");
  const [photoCount, setPhotoCount] = useState(0);
  const [lastCaptureAt, setLastCaptureAt] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const statusLabel: Record<SessionStatus, string> = {
    waiting: "Waiting",
    ready: "Camera Ready",
    shooting: "Shooting",
    ended: "Ended",
  };

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const pollingRef = useRef<number | null>(null);
  const candidateCacheRef = useRef<Set<string>>(new Set());
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch(`/api/sessions?token=${token}&role=admin`, {
          cache: "no-store",
        });
        const data = (await res.json()) as {
          ok: boolean;
          session?: {
            id: string;
            status: SessionStatus;
            photoCount: number;
            lastCaptureAt: string | null;
          };
        };
        if (!data.ok || !data.session) {
          setErrorMessage("この管理URLは無効です。");
          return;
        }
        setSessionId(data.session.id);
        setStatus(data.session.status);
        setPhotoCount(data.session.photoCount);
        setLastCaptureAt(data.session.lastCaptureAt ?? null);
      } catch {
        setErrorMessage("通信が不安定です。少しお待ちください。");
      }
    };

    loadSession();
    const interval = window.setInterval(loadSession, 2000);
    return () => {
      window.clearInterval(interval);
      stopPolling();
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [token]);

  const stopPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = window.setInterval(async () => {
      if (!pcRef.current) return;
      const signals = await getSignals(sessionId, "photographer");

      if (signals.answer && !pcRef.current.currentRemoteDescription) {
        await pcRef.current.setRemoteDescription(signals.answer);
        const pending = pendingCandidatesRef.current;
        pendingCandidatesRef.current = [];
        for (const queued of pending) {
          try {
            await pcRef.current.addIceCandidate(queued);
          } catch {
            // ignore while connection settles
          }
        }
      }

      for (const candidate of signals.candidates ?? []) {
        const key = JSON.stringify(candidate);
        if (candidateCacheRef.current.has(key)) continue;
        candidateCacheRef.current.add(key);
        if (!pcRef.current.currentRemoteDescription) {
          pendingCandidatesRef.current.push(candidate);
          continue;
        }
        try {
          await pcRef.current.addIceCandidate(candidate);
        } catch {
          // ignore duplicates while connection settles
        }
      }
    }, 1000);
  };

  const connect = async () => {
    if (!sessionId || isConnecting) return;
    setIsConnecting(true);

    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;
    candidateCacheRef.current = new Set();
    pendingCandidatesRef.current = [];

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setIsConnected(state === "connected");
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        postSignal(sessionId, "photographer", "candidate", event.candidate);
      }
    };

    const channel = pc.createDataChannel("control", { ordered: true });
    channelRef.current = channel;
    channel.onmessage = (event) => {
      if (typeof event.data !== "string") return;
      try {
        const message = JSON.parse(event.data) as {
          type: string;
          capturedAt?: string;
        };
        if (message.type === "captured" && message.capturedAt) {
          setLastCaptureAt(message.capturedAt);
        }
      } catch {
        // ignore non-JSON payloads
      }
    };

    const offer = await pc.createOffer({ offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    await postSignal(sessionId, "photographer", "offer", offer);

    startPolling();
    setIsConnecting(false);
  };

  const updateStatus = async (nextStatus: SessionStatus) => {
    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ token, role: "admin", status: nextStatus }),
    });
    setStatus(nextStatus);
  };

  const runCountdown = () =>
    new Promise<void>((resolve) => {
      let count = 3;
      setCountdown(count);
      const timer = window.setInterval(() => {
        count -= 1;
        if (count <= 0) {
          window.clearInterval(timer);
          setCountdown(null);
          resolve();
        } else {
          setCountdown(count);
        }
      }, 1000);
    });

  const startShooting = async () => {
    await updateStatus("shooting");
    if (!isConnected) {
      await connect();
    }
  };

  const requestCapture = async () => {
    if (!channelRef.current || channelRef.current.readyState !== "open") return;
    await runCountdown();
    channelRef.current.send(
      JSON.stringify({ type: "capture", requestedAt: new Date().toISOString() })
    );
  };

  const nextCut = () => {
    setLastCaptureAt(null);
  };

  const endShooting = async () => {
    await updateStatus("ended");
    stopPolling();
    await resetRoom(sessionId);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setIsConnected(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Photographer Console
          </p>
          <h1 className="text-2xl font-semibold">カメラマン画面</h1>
          <p className="text-sm text-zinc-600">
            状態を確認し、撮影開始とシャッター操作を行います。
          </p>
        </header>

        {errorMessage && (
          <p className="rounded-xl bg-white p-4 text-sm text-zinc-600 shadow-sm">
            {errorMessage}
          </p>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">セッション状態</p>
                <p className="text-lg font-semibold">{statusLabel[status]}</p>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <p>保存済み: {photoCount}枚</p>
                {lastCaptureAt && (
                  <p>{new Date(lastCaptureAt).toLocaleString("ja-JP")}</p>
                )}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl bg-zinc-900">
              <div className="relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="aspect-video w-full object-cover"
                />
                {countdown && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-5xl font-semibold text-white">
                    {countdown}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">操作</h2>
            <div className="mt-4 flex flex-col gap-3">
              <button
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
                onClick={startShooting}
                disabled={!sessionId || isConnecting || status === "ended"}
              >
                撮影開始
              </button>
              <button
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
                onClick={requestCapture}
                disabled={!isConnected || status !== "shooting"}
              >
                シャッター
              </button>
              <button
                className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300"
                onClick={nextCut}
              >
                次のカット
              </button>
              <button
                className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300"
                onClick={endShooting}
                disabled={status === "ended"}
              >
                撮影終了
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
