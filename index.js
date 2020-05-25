const socket = io();
const localVideo = document.querySelector('.local-video');
const remoteVideo = document.querySelector('.remote-video');
const callButton = document.getElementById('callAction');
const mediaConstraints = { video: true };

// Initialize peer connection
var localPeerConnection = new RTCPeerConnection();

localPeerConnection.addEventListener('icecandidate', (event) => {
  console.log('sending ICE candidate');
  const candidate = event.candidate;
  if (candidate) socket.emit('candidate', JSON.stringify({ candidate }));
});

localPeerConnection.addEventListener('addstream', (event) => {
  console.log('streaming');
  remoteVideo.srcObject = event.stream;
});

// Call action
// Create and send offer to remote peers
callButton.addEventListener('click', callActionHandler);

function callActionHandler() {
  localPeerConnection.createOffer()
    .then(sdp => {
      console.log('Sending offer');
      localPeerConnection.setLocalDescription(new RTCSessionDescription(sdp));
      socket.emit('sdp', JSON.stringify({ sdp }));
    });
}

// Get local media feed
navigator.mediaDevices.getUserMedia(mediaConstraints)
  .then(localVideoStreamHandler)
  .catch(localVideoStreamFailure);

function localVideoStreamHandler(localStream) {
  localVideo.srcObject = localStream;
  localPeerConnection.addStream(localStream);
  callButton.disabled = false;
}

function localVideoStreamFailure() {
  alert('David, you suck!');
}

// Communications with the remote peer through signaling server
socket.on('connect', () => {
  // Register candidates
  socket.on('candidate', (message) => {
    console.log('candidate received');

    const candidate = JSON.parse(message).candidate;
    localPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  });

  // Listen for SDP message with session details from the remote peer
  socket.on('sdp', message => {
    console.log('sdp received');

    // Get the remote SDP and set it
    const remoteSDP = new RTCSessionDescription(JSON.parse(message).sdp);
    localPeerConnection.setRemoteDescription(remoteSDP);

    // Respond with ours
    localPeerConnection.createAnswer()
      .then(sdp => {
        localPeerConnection.setLocalDescription(new RTCSessionDescription(sdp));
        socket.emit('answer', JSON.stringify({ sdp }));
      });
  });

  // Listen for answer to offer sent to remote peer
  socket.on('answer', (message) => {
    console.log('answer received');

    const remoteSDP = JSON.parse(message).sdp;
    localPeerConnection.setRemoteDescription(remoteSDP);
  });
});
