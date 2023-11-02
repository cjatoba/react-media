"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../src/contexts/SocketProvider";
import { useRouter } from "next/navigation";

export default function LobbyPage() {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const router = useRouter();

  const handleSubmitForm = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      socket.emit("room:join", { email, room });
    },
    [email, room, socket],
  );

  const handleJoinRoom = useCallback(
    (data: any) => {
      const { room } = data;

      router.push(`/room/${room}`);
    },
    [router],
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);

    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>Lobby</h1>

      <form className="flex flex-col mt-4 gap-4" onSubmit={handleSubmitForm}>
        <div className="flex justify-between">
          <label htmlFor="email">Email ID:</label>
          <input
            className="text-black w-1/2"
            type="email"
            name="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex justify-between">
          <label htmlFor="room">Room Number:</label>
          <input
            className="text-black w-1/2"
            type="text"
            name="room"
            id="room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </div>
        <button className="py-2 px-4 bg-green-950" type="submit">
          Join
        </button>
      </form>
    </div>
  );
}
