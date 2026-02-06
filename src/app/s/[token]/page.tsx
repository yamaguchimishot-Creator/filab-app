"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getSignals, postSignal } from "@/lib/signaling";

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
};

export default function ShootingPage() {
  const { token } = useParams<{ token: string }>();
  const [sessionId, setSessionId] = useState("");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const pollingRef = useRef<number | null>(null);
  const candidateCacheRef = useRef<Set<string>>(new Set());
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions?token=${token}&role=user`, {
          cache: "no-store",
        });
        const data = (await res.json()) as {
          ok: boolean;
          session?: { id: string };
        };
        if (!data.ok || !data.session) {
          setErrorMessage("この撮影URLは無効です。");
          return;
        }
        setSessionId(data.session.id);
      } catch {
        setErrorMessage("通信が不安定です。少しお待ちください。");
      }
    };

    fetchSession();

    return () => {
      stopPolling();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [token]);

  useEffect(() => {
    if (!sessionId || !isCameraReady || isConnecting) return;
    void connect();
  }, [sessionId, isCameraReady, isConnecting]);

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
      const signals = await getSignals(sessionId, "camera");

      if (signals.offer && !pcRef.current.currentRemoteDescription) {
        await pcRef.current.setRemoteDescription(signals.offer);
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        await postSignal(sessionId, "camera", "answer", answer);
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
      if (state === "failed" || state === "disconnected") {
        setStatusMessage("通信が不安定です。少しお待ちください。");
      } else if (state === "connected") {
        setStatusMessage("");
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        postSignal(sessionId, "camera", "candidate", event.candidate);
      }
    };

    pc.ondatachannel = (event) => {
      channelRef.current = event.channel;
      event.channel.onmessage = (message) => {
        if (typeof message.data !== "string") return;
        try {
          const payload = JSON.parse(message.data) as { type: string };
          if (payload.type === "capture") {
            captureAndUpload();
          }
        } catch {
          // ignore non-JSON payloads
        }
      };
    };

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, streamRef.current!);
      });
    }

    startPolling();
    setIsConnecting(false);
  };

  const captureAndUpload = async () => {
    const video = localVideoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const capturedAt = new Date().toISOString();

    await fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ token, role: "user", dataUrl, capturedAt }),
    });

    if (channelRef.current?.readyState === "open") {
      channelRef.current.send(
        JSON.stringify({ type: "captured", capturedAt })
      );
    }
  };

  const startCamera = async () => {
    try {
      setPermissionError(false);
      setHasStarted(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsCameraReady(true);

      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ token, role: "user", status: "ready" }),
      });
    } catch {
      setPermissionError(true);
      setHasStarted(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-900">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-10 text-center">
        <header className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">撮影準備をしています</h1>
          <p className="text-sm text-zinc-700">
            このままスマホを縦にして、カメラの前でお待ちください。
          </p>
          <p className="text-sm text-zinc-600">
            撮影はカメラマンが操作します。
            <br />
            あなたは操作する必要はありません。
          </p>
        </header>

        {permissionError && (
          <p className="rounded-xl bg-white p-4 text-sm text-zinc-600 shadow-sm">
            撮影のためカメラへのアクセスを許可してください
          </p>
        )}

        {errorMessage && (
          <p className="rounded-xl bg-white p-4 text-sm text-zinc-600 shadow-sm">
            {errorMessage}
          </p>
        )}

        {!hasStarted && (
          <button
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            onClick={startCamera}
            disabled={!sessionId}
          >
            カメラを起動する
          </button>
        )}

        {hasStarted && (
          <p className="text-sm text-zinc-700">
            撮影中です。そのまま自然な表情でお待ちください。
          </p>
        )}

        {statusMessage && (
          <p className="text-xs text-zinc-500">{statusMessage}</p>
        )}
      </main>

      <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
    </div>
  );
}
