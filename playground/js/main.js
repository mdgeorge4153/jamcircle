/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);

let startTime;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

localVideo.addEventListener('loadedmetadata', function() {
  console.log(`Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('loadedmetadata', function() {
  console.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('resize', () => {
  console.log(`Remote video size changed to ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`);
  // We'll use the first onsize callback as an indication that video has started
  // playing out.
  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    console.log('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
    startTime = null;
  }
});

class VideoConnection {
  constructor(configuration) {
    this.pc = new RTCPeerConnection(configuration);
    this.pc.addEventListener('icecandidate', e => this.onIceCandidate(e));
    this.pc.addEventListener('iceconnectionstatechange', e => this.onIceStateChange(e));
  }

  async addIceCandidate(candidate) {
    try {
      await this.pc.addIceCandidate(candidate);
      this.onAddIceCandidateSuccess();
    } catch (e) {
      this.onAddIceCandidateError(e);
      throw e;
    }
  }

  async onIceCandidate(event) {
    try {
      await (getOtherPc(this.pc).addIceCandidate(event.candidate));
      this.onAddIceCandidateSuccess();
    } catch (e) {
      this.onAddIceCandidateError(e);
      throw e;
    }
    console.log(`${this.getName()} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
  }

  close() {
    this.pc.close();
    this.pc = null;
  }

  onAddIceCandidateSuccess() {
    console.log(`${this.getName()} addIceCandidate success`);
  }

  onAddIceCandidateError(pc, error) {
    console.log(`${this.getName()} failed to add ICE Candidate: ${error.toString()}`);
  }

  onIceStateChange(event) {
    if (this.pc) {
      console.log(`${this.getName()} ICE state: ${this.pc.iceConnectionState}`);
      console.log('ICE state change event: ', event);
    }
  }

  onCreateSessionDescriptionError(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }

  onSetLocalSuccess() {
    console.log(`${this.getName()} setLocalDescription complete`);
  }

  onSetRemoteSuccess() {
    console.log(`${this.getName()} setRemoteDescription complete`);
  }

  onSetSessionDescriptionError(error) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }
}

class VideoSource extends VideoConnection {
  constructor(config) {
    super(config);
    this.pc1 = this.pc;
  }

  getName() {
    return 'pc1';
  }

  addTrack(track) {
    console.log(track);
    track.contentHint="hello hello";
    this.pc1.addTrack(track, new MediaStream());
  }

  async createOffer() {
    try {
      console.log('pc1 createOffer start');
      const desc = await this.pc1.createOffer(offerOptions);

      console.log('pc1 setLocalDescription start');
      try {
        await this.pc1.setLocalDescription(desc);
        this.onSetLocalSuccess();
      } catch (e) {
        this.onSetSessionDescriptionError(e);
        throw e;
      }

      return desc;
    } catch (e) {
      this.onCreateSessionDescriptionError(e);
      throw e;
    }
  }

  async setAnswer(answer) {
    console.log('pc1 setRemoteDescription start');
    try {
      await this.pc1.setRemoteDescription(answer);
      this.onSetRemoteSuccess();
    } catch (e) {
      this.onSetSessionDescriptionError(e);
      throw e;
    }
  }
}

class VideoSink extends VideoConnection {
  constructor(config, gotRemoteStream) {
    super(config);
    this.pc2 = this.pc;
    this.pc2.addEventListener('track', gotRemoteStream);
  }
  
  getName() {
    return 'pc2';
  }

  async createAnswer(desc) {
    console.log('pc2 setRemoteDescription start');
    try {
      await this.pc2.setRemoteDescription(desc);
      this.onSetRemoteSuccess();
    } catch (e) {
      this.onSetSessionDescriptionError(e);
      throw e;
    }

    console.log('pc2 createAnswer start');
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    try {
      const answer = await this.pc2.createAnswer();

      console.log('pc2 setLocalDescription start');
      try {
        await sink.pc2.setLocalDescription(answer);
        sink.onSetLocalSuccess();
        return answer;
      } catch (e) {
        sink.onSetSessionDescriptionError(e);
        throw e;
      }

      return answer;
    } catch (e) {
      this.onCreateSessionDescriptionError(e);
      throw e;
    }
  }
}

let localStream;
let source;
let sink;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

function getOtherPc(pc) {
  return (pc === source.pc1) ? sink.pc2 : source.pc1;
}

async function start() {
  console.log('Requesting local stream');
  startButton.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    console.log('Received local stream');
    localVideo.srcObject = stream;
    localStream = stream;
    callButton.disabled = false;
  } catch (e) {
    alert(`getUserMedia() error: ${e.name}`);
    throw e;
  }
}

function getSelectedSdpSemantics() {
  const sdpSemanticsSelect = document.querySelector('#sdpSemantics');
  const option = sdpSemanticsSelect.options[sdpSemanticsSelect.selectedIndex];
  return option.value === '' ? {} : {sdpSemantics: option.value};
}

async function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log('Starting call');
  startTime = window.performance.now();
  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}`);
  }
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}`);
  }
  const configuration = getSelectedSdpSemantics();
  console.log('RTCPeerConnection configuration:', configuration);
  source = new VideoSource(configuration);
  console.log('Created local peer connection object pc1');
  sink = new VideoSink(configuration, addRemoteStream);
  console.log('Created remote peer connection object sink.pc2');

  localStream.getTracks().forEach((track) => source.addTrack(track));
  console.log('Added local stream to pc1');

  const offer = await source.createOffer();
  console.log(`Offer from pc1\n${offer.sdp}`);

  const answer = await sink.createAnswer(offer);
  console.log(`Answer from pc2:\n${answer.sdp}`);

  await source.setAnswer(answer);
}

function addRemoteStream(e) {
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0];
    console.log('pc2 received remote stream');
  }
}

function hangup() {
  console.log('Ending call');
  source.close();
  sink.close();
  hangupButton.disabled = true;
  callButton.disabled = false;
}
