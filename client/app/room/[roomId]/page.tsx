"use client";

import { useSocket } from "@/src/contexts/SocketProvider";
import peerService from "@/src/service/peer";
import { useCallback, useEffect, useState } from "react";
import ReactPlayer from "react-player";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const roomId = params.roomId;
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>();

  const handleUserJoined = useCallback(({ email, id }: any) => {
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const offer = await peerService.getOffer();
    socket.emit("user:call", {
      to: remoteSocketId,
      offer,
    });

    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }: any) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMyStream(stream);

      const ans = peerService.getAnswer(offer);
      socket.emit("call:accepted", {
        to: from,
        ans,
      });
    },
    [socket],
  );

  const sendStreams = useCallback(() => {
    if (!myStream || !peerService.peer) {
      return;
    }

    for (const track of myStream.getTracks()) {
      peerService.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }: any) => {
      peerService.setLocalDescription(ans);
      sendStreams();
    },
    [sendStreams],
  );

  const handleNegotiationNeededEvent = useCallback(async () => {
    const offer = await peerService.getOffer();
    socket.emit("peer:negotiation:needed", {
      offer,
      to: remoteSocketId,
    });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    if (!peerService.peer) {
      return;
    }

    peerService.peer.addEventListener(
      "negotiationneeded",
      handleNegotiationNeededEvent,
    );

    return () => {
      peerService.peer!.removeEventListener(
        "negotiationneeded",
        handleNegotiationNeededEvent,
      );
    };
  }, [handleNegotiationNeededEvent]);

  const handleNegotiationNeededIncoming = useCallback(
    async ({ from, offer }: any) => {
      const ans = await peerService.getAnswer(offer);
      socket.emit("peer:negotiation:done", {
        to: from,
        ans,
      });
    },
    [socket],
  );

  const handleNegotiationFinal = useCallback(async ({ ans }: any) => {
    await peerService.setLocalDescription(ans);
  }, []);

  const handleTrackEvent = useCallback((event: RTCTrackEvent) => {
    const remoteStream = event.streams;

    setRemoteStream(remoteStream[0]);
  }, []);

  useEffect(() => {
    peerService.peer &&
      peerService.peer.addEventListener("track", handleTrackEvent);

    return () => {
      peerService.peer &&
        peerService.peer.removeEventListener("track", handleTrackEvent);
    };
  }, [handleTrackEvent]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:negotiation:needed", handleNegotiationNeededIncoming);
    socket.on("peer:negotiation:final", handleNegotiationFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:negotiation:needed", handleNegotiationNeededIncoming);
      socket.off("peer:negotiation:final", handleNegotiationFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegotiationNeededIncoming,
    handleNegotiationFinal,
  ]);

  return (
    <>
      <h1>{`Room ${roomId}`}</h1>
      <h4>{remoteSocketId ? "Connected" : "Not Connected"}</h4>

      {myStream && <button onClick={sendStreams}>Send Stream</button>}

      {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}

      {myStream && (
        <>
          <h2>My Stream</h2>
          <ReactPlayer
            playing
            muted
            height={"100px"}
            width={"200px"}
            url={myStream}
          />
        </>
      )}

      {remoteStream && (
        <>
          <h2>Remote Stream</h2>
          <ReactPlayer
            playing
            muted
            height={"100px"}
            width={"200px"}
            url={remoteStream}
          />
        </>
      )}
    </>
  );
}
