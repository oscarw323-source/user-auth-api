const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

let peerConnection = null;
let localStream = null;
let callTimerInterval = null;
let callSeconds = 0;
let isMuted = false;
let isCameraOff = false;
let incomingCallData = null;
let activeCallUserId = null;
let ringInterval = null;
let callEventsInitialized = false;
let isVideoCall = false;

const normalizeUserId = (id) => String(id).replace(/^0+/, "") || String(id);

function resetCallEvents() {
  callEventsInitialized = false;
}

function startRinging() {
  try {
    if (!window.audioCtx)
      window.audioCtx = new (
        window.AudioContext || window.webkitAudioContext
      )();
    if (window.audioCtx.state === "suspended") window.audioCtx.resume();
    stopRinging();
    const playBeep = () => {
      try {
        const ctx = window.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(480, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {}
    };
    playBeep();
    ringInterval = setInterval(playBeep, 1500);
  } catch (e) {
    const fallbackBeep = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (err) {}
    };
    fallbackBeep();
    ringInterval = setInterval(fallbackBeep, 1500);
  }
}

function stopRinging() {
  clearInterval(ringInterval);
  ringInterval = null;
}

function setCallState(state) {
  const statusEl = document.getElementById("callModalStatus");
  if (state === "incoming") {
    statusEl.textContent = isVideoCall
      ? "Входящий видео звонок"
      : "Входящий звонок";
  } else if (state === "outgoing") {
    statusEl.textContent = "Звонит...";
  } else if (state === "active") {
    statusEl.textContent = isVideoCall ? "Видео звонок" : "Звонок";
  } else {
    statusEl.textContent = "";
  }
  statusEl.className =
    "call-modal-status" + (state === "outgoing" ? " calling" : "");
  document.getElementById("callActionsIncoming").style.display =
    state === "incoming" ? "flex" : "none";
  document.getElementById("callActionsOutgoing").style.display =
    state === "outgoing" ? "flex" : "none";
  document.getElementById("callActionsActive").style.display =
    state === "active" ? "flex" : "none";
  const timer = document.getElementById("callModalTimer");
  timer.style.display = state === "active" ? "block" : "none";
  if (state !== "active") timer.textContent = "0:00";
}

function showCallModal(name, avatarUrl, state) {
  document.getElementById("callModalAvatar").src =
    avatarUrl || `https://api.dicebear.com/7.x/lorelei/svg?seed=${name}`;
  document.getElementById("callModalName").textContent = name;
  document.getElementById("callModal").style.display = "flex";
  setCallState(state);
}

function hideCallModal() {
  document.getElementById("callModal").style.display = "none";
  clearInterval(callTimerInterval);
  callTimerInterval = null;
  callSeconds = 0;
  document.getElementById("callModalTimer").textContent = "0:00";
  document.getElementById("localVideo").style.display = "none";
  document.getElementById("remoteVideo").style.display = "none";
  document.getElementById("localVideo").srcObject = null;
  document.getElementById("remoteVideo").srcObject = null;
  document.getElementById("callModalAvatar").style.display = "block";
}

function showVideoStreams() {
  document.getElementById("callModalAvatar").style.display = "none";
  document.getElementById("localVideo").style.display = "block";
  document.getElementById("remoteVideo").style.display = "block";
}

function startCallTimer() {
  if (callTimerInterval) return;
  callSeconds = 0;
  callTimerInterval = setInterval(() => {
    callSeconds++;
    const m = Math.floor(callSeconds / 60);
    const s = callSeconds % 60;
    document.getElementById("callModalTimer").textContent =
      `${m}:${s.toString().padStart(2, "0")}`;
  }, 1000);
}

function closePeerConnection() {
  if (peerConnection) {
    peerConnection.onicecandidate = null;
    peerConnection.ontrack = null;
    peerConnection.onconnectionstatechange = null;
    peerConnection.close();
    peerConnection = null;
  }
}

function createPeerConnection(socket, toUserId) {
  closePeerConnection();
  peerConnection = new RTCPeerConnection(STUN_SERVERS);

  peerConnection.onicecandidate = (e) => {
    if (e.candidate)
      socket.emit("ice_candidate", { toUserId, candidate: e.candidate });
  };

  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection?.connectionState;
    if (state === "failed" || state === "disconnected") {
      cleanupCall();
    }
  };

  peerConnection.ontrack = (e) => {
    const stream = e.streams[0];
    if (!stream) return;
    const hasVideo = stream.getVideoTracks().length > 0;
    if (hasVideo) {
      showVideoStreams();
      const remoteVideo = document.getElementById("remoteVideo");
      remoteVideo.srcObject = stream;
      remoteVideo.play().catch(() => {});
    } else {
      let remoteAudio = document.getElementById("remoteAudio");
      if (!remoteAudio) {
        remoteAudio = document.createElement("audio");
        remoteAudio.id = "remoteAudio";
        remoteAudio.autoplay = true;
        document.body.appendChild(remoteAudio);
      }
      remoteAudio.srcObject = stream;
    }
  };

  if (localStream) {
    localStream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStream));
  }

  return peerConnection;
}

function cleanupCall() {
  stopRinging();
  closePeerConnection();
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  document.getElementById("remoteAudio")?.remove();
  isMuted = false;
  isCameraOff = false;
  isVideoCall = false;
  incomingCallData = null;
  activeCallUserId = null;
  resetMuteIcon();
  resetCameraIcon();
  hideCallModal();
}

function resetMuteIcon() {
  document.getElementById("iconMic").style.display = "block";
  document.getElementById("iconMicMuted").style.display = "none";
  document.getElementById("muteBtn")?.classList.remove("active");
}

function resetCameraIcon() {
  document.getElementById("iconCamera").style.display = "block";
  document.getElementById("iconCameraOff").style.display = "none";
  document.getElementById("cameraBtn")?.classList.remove("active");
}

async function startCall() {
  if (!currentDirectChat) return;
  if (peerConnection) cleanupCall();
  const toUserId = normalizeUserId(currentDirectChat.userId);
  isVideoCall = false;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    alert("Нет доступа к микрофону");
    return;
  }
  activeCallUserId = toUserId;
  createPeerConnection(socket, toUserId);
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("call_offer", { toUserId, offer, isVideo: false });
  showCallModal(
    currentDirectChat.userName,
    currentDirectChat.avatarUrl,
    "outgoing",
  );
}

async function startVideoCall() {
  if (!currentDirectChat) return;
  if (peerConnection) cleanupCall();
  const toUserId = normalizeUserId(currentDirectChat.userId);
  isVideoCall = true;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { facingMode: "user" },
    });
  } catch {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      isVideoCall = false;
    } catch {
      alert("Нет доступа к камере или микрофону");
      return;
    }
  }
  if (isVideoCall) {
    document.getElementById("localVideo").srcObject = localStream;
  }
  activeCallUserId = toUserId;
  createPeerConnection(socket, toUserId);
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("call_offer", { toUserId, offer, isVideo: isVideoCall });
  showCallModal(
    currentDirectChat.userName,
    currentDirectChat.avatarUrl,
    "outgoing",
  );
}

function cancelCall() {
  if (activeCallUserId) socket.emit("call_end", { toUserId: activeCallUserId });
  cleanupCall();
}

function handleIncomingCall(data) {
  if (activeCallUserId) return;
  incomingCallData = data;
  isVideoCall = data.isVideo || false;
  showCallModal(data.fromUserName, data.fromAvatarUrl, "incoming");
  startRinging();
}

async function acceptCall() {
  if (!incomingCallData) return;
  stopRinging();
  const toUserId = normalizeUserId(incomingCallData.fromUserId);
  try {
    if (isVideoCall) {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });
      document.getElementById("localVideo").srcObject = localStream;
    } else {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
  } catch {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      isVideoCall = false;
    } catch {
      alert("Нет доступа к микрофону");
      return;
    }
  }
  activeCallUserId = toUserId;
  createPeerConnection(socket, toUserId);
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(incomingCallData.offer),
  );
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("call_answer", { toUserId, answer });
  showCallModal(
    incomingCallData.fromUserName,
    incomingCallData.fromAvatarUrl,
    "active",
  );
  if (isVideoCall) showVideoStreams();
  startCallTimer();
  incomingCallData = null;
  resetMuteIcon();
  resetCameraIcon();
  document.getElementById("cameraBtn").style.display = isVideoCall
    ? "flex"
    : "none";
}

function rejectCall() {
  if (!incomingCallData) return;
  stopRinging();
  const toUserId = normalizeUserId(incomingCallData.fromUserId);
  socket.emit("call_reject", { toUserId });
  cleanupCall();
}

function endCallActive() {
  if (activeCallUserId) socket.emit("call_end", { toUserId: activeCallUserId });
  cleanupCall();
}

function toggleCallMute() {
  if (!localStream) return;
  isMuted = !isMuted;
  localStream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
  document.getElementById("iconMic").style.display = isMuted ? "none" : "block";
  document.getElementById("iconMicMuted").style.display = isMuted
    ? "block"
    : "none";
  document.getElementById("muteBtn").classList.toggle("active", isMuted);
}

function toggleCamera() {
  if (!localStream) return;
  isCameraOff = !isCameraOff;
  localStream.getVideoTracks().forEach((t) => (t.enabled = !isCameraOff));
  document.getElementById("iconCamera").style.display = isCameraOff
    ? "none"
    : "block";
  document.getElementById("iconCameraOff").style.display = isCameraOff
    ? "block"
    : "none";
  document.getElementById("cameraBtn").classList.toggle("active", isCameraOff);
}

function setupCallSocketEvents(socket) {
  if (callEventsInitialized) return;
  callEventsInitialized = true;

  socket.on("call_incoming", (data) => handleIncomingCall(data));

  socket.on("call_answered", async (data) => {
    if (!peerConnection) return;
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer),
    );
    activeCallUserId = normalizeUserId(data.fromUserId);
    showCallModal(
      document.getElementById("callModalName").textContent,
      document.getElementById("callModalAvatar").src,
      "active",
    );
    if (isVideoCall) showVideoStreams();
    startCallTimer();
    resetMuteIcon();
    resetCameraIcon();
    document.getElementById("cameraBtn").style.display = isVideoCall
      ? "flex"
      : "none";
  });

  socket.on("ice_candidate", async (data) => {
    if (!peerConnection) return;
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (e) {}
  });

  socket.on("call_rejected", () => {
    cleanupCall();
    showNotification("loginNotification", "Звонок отклонён", "error");
  });

  socket.on("call_ended", () => cleanupCall());
}
