type Role = "photographer" | "camera";
type SignalType = "offer" | "answer" | "candidate" | "reset";

type SignalResponse = {
  ok: boolean;
  offer: RTCSessionDescriptionInit | null;
  answer: RTCSessionDescriptionInit | null;
  candidates: RTCIceCandidateInit[];
  updatedAt: number;
};

export async function postSignal(
  roomId: string,
  role: Role,
  type: SignalType,
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit
) {
  await fetch("/api/signaling", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ roomId, role, type, payload }),
  });
}

export async function getSignals(roomId: string, role: Role) {
  const res = await fetch(
    `/api/signaling?roomId=${encodeURIComponent(roomId)}&role=${role}`,
    { cache: "no-store" }
  );
  return (await res.json()) as SignalResponse;
}

export async function resetRoom(roomId: string) {
  await postSignal(roomId, "photographer", "reset");
}
