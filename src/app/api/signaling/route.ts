import { NextRequest, NextResponse } from "next/server";

type Role = "photographer" | "camera";
type SignalType = "offer" | "answer" | "candidate" | "reset";

type RoomState = {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidates: {
    photographer: RTCIceCandidateInit[];
    camera: RTCIceCandidateInit[];
  };
  updatedAt: number;
};

type SignalPayload = {
  roomId: string;
  role: Role;
  type: SignalType;
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit;
};

const store = globalThis as typeof globalThis & {
  __webrtcRooms?: Map<string, RoomState>;
};

const getRooms = () => {
  if (!store.__webrtcRooms) {
    store.__webrtcRooms = new Map<string, RoomState>();
  }
  return store.__webrtcRooms;
};

const getRoom = (roomId: string) => {
  const rooms = getRooms();
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      candidates: { photographer: [], camera: [] },
      updatedAt: Date.now(),
    });
  }
  return rooms.get(roomId)!;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SignalPayload;
  const { roomId, role, type, payload } = body;

  if (!roomId || !role || !type) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload" },
      { status: 400 }
    );
  }

  if (type === "reset") {
    getRooms().delete(roomId);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  }

  const room = getRoom(roomId);
  if (type === "offer" && payload) {
    room.offer = payload as RTCSessionDescriptionInit;
  }
  if (type === "answer" && payload) {
    room.answer = payload as RTCSessionDescriptionInit;
  }
  if (type === "candidate" && payload) {
    room.candidates[role].push(payload as RTCIceCandidateInit);
  }

  room.updatedAt = Date.now();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const role = searchParams.get("role") as Role | null;

  if (!roomId || !role) {
    return NextResponse.json(
      { ok: false, error: "Missing roomId or role" },
      { status: 400 }
    );
  }

  const room = getRoom(roomId);
  const remoteRole: Role = role === "photographer" ? "camera" : "photographer";

  return NextResponse.json(
    {
      ok: true,
      offer: room.offer ?? null,
      answer: room.answer ?? null,
      candidates: room.candidates[remoteRole],
      updatedAt: room.updatedAt,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
