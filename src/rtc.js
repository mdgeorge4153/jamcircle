/**
 * This module provides a simple interface for streaming a collection of
 * MediaStreams from one endpoint to another.
 *
 * On the sending endpoint:
 *    let source = new VideoSource(streams, send_signal, config);
 *    let offer  = await source.createOffer();
 *    // send offer to remote endpoint
 *
 *    // when you're done:
 *    source.close();
 *
 * On the receiving endpoint:
 *    // receive offer from video sender
 *    let sink    = new VideoSink(send_signal, config);
 *    let streams = await sink.getTracks(offer);
 *
 *    // when you're done:
 *    sink.close();
 * 
 * The streams object passed to the source constructor should have MediaStreams
 * as values; you can use any keys you want.  The sink's getTracks method will
 * return an object with the same structure (the same keys mapped, each mapped
 * to a MediaStream).
 *
 * Both constructors require a send_signal argument; this should be a function
 * that, when called, delivers its argument to the remote endpoint and calls
 * recv_signal on it.  As a simple (local) example:
 *
 *    let sink;
 *    let source = new VideoSource(..., (msg) =>   sink.recv_signal(msg), ...);
 *    sink       = new   VideoSink(..., (msg) => source.recv_signal(msg), ...);
 *
 * A more realistic application would use websockets or something to convey the
 * message to the remote endpoint (this is called signaling in WebRTC parlance).
 *
 * The send_signal function given to the source constructor won't be called
 * until after getTracks(() is called on the corresponding sink, so you don't
 * have to worry about messages getting sent before the remote endpoint is set
 * up to receive them.
 *
 * // TODO: document config object
 * // TODO: document exception behavior
 * // TODO: typescript interface
 */

'use strict';

// TODO: clean up / simplify implementation, consolidate exceptions and logging

let default_configuration = {
  log: (msg) => msg,
}

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

class VideoConnection {
  constructor(configuration, send_signal) {
    this.pc = new RTCPeerConnection(configuration);
    this.pc.addEventListener('icecandidate', e => this._onIceCandidate(e));
    this.pc.addEventListener('iceconnectionstatechange', e => this._onIceStateChange(e));
    this.log      = (msg) => msg;
    this.send_signal = send_signal;
    this.can_send = false;
    this.queue    = [];

    this.name = configuration.name;
  }

  recv_signal(msg) {
    if (msg.candidate)
      return this._addIceCandidate(JSON.parse(msg.candidate));
    else
      this.log('unexpected message: ', msg);
  }

  close() {
    this.pc.close();
    this.pc = null;
  }

  _start_sending() {
    if (this.can_send)
      return;

    this.can_send = true;
    for (let msg of this.queue)
      this.send_signal(msg);
    this.queue = null;
  }

  async _addIceCandidate(candidate) {
    // TODO: buffer messages until can_send
    try {
      await this.pc.addIceCandidate(candidate);
      this.log(`${this.name} addIceCandidate success`);
    } catch (e) {
      this.log(`${this.name} failed to add ICE Candidate: ${e.toString()}`);
      throw e;
    }
  }

  async _onIceCandidate(event) {
    let message = {candidate: JSON.stringify(event.candidate)};

    if (this.can_send) {
      try {
        await this.send_signal(message);
        this.log(`${this.name} addIceCandidate success`);
      } catch (e) {
        this.log(`${this.name} failed to add ICE Candidate: ${e.toString()}`);
        throw e;
      }
    } else {
      this.queue.push(message);
    }
    this.log(`${this.name} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
  }

  _onIceStateChange(event) {
    if (this.pc) {
      this.log(`${this.name} ICE state: ${this.pc.iceConnectionState}`);
      this.log('ICE state change event: ', event);
    }
  }
}

class VideoSource extends VideoConnection {
  constructor(streams, send_signal, config = default_configuration) {
    super({name: 'source', ...config}, send_signal);
    this.streams = streams;
  }

  recv_signal(msg) {
    this._start_sending();
    if (msg.answer)
      return this._setAnswer(msg.answer);
    else
      return super.recv_signal(msg);
  }

  async createOffer() {
    try {
      this.log(`${this.name} createOffer start`);

      let ids = {};
      console.log(this.streams)
      for (let [key, stream] of Object.entries(this.streams)) {
        ids[stream.id] = key;
        for (let track of stream.getTracks())
          this.pc.addTrack(track, stream);
      }

      const desc = await this.pc.createOffer(offerOptions);

      this.log(`${this.name} setLocalDescription start`);
      try {
        await this.pc.setLocalDescription(desc);
        this.log(`${this.name} setLocalDescription complete`);
      } catch (e) {
        this.log(`Failed to set session description: ${e.toString()}`);
        throw e;
      }

      return {offer: desc, ids};
    } catch (e) {
      this.log(`Failed to create session description: ${e.toString()}`);
      throw e;
    }
  }

  async _setAnswer(answer) {
    this.log(`${this.name} setRemoteDescription start`);
    try {
      await this.pc.setRemoteDescription(answer);
      this.log(`${this.name} setRemoteDescription complete`);
    } catch (e) {
      this.log(`Failed to set session description: ${e.toString()}`);
      throw e;
    }
  }
}

class VideoSink extends VideoConnection {
  constructor(send_signal, config) {
    super({name: 'sink', ...config}, send_signal);
    this.ids = null;
    this._start_sending();
    this.streams = {};
  }

  async getTracks({offer: desc, ids}) {

    let result = new Promise((resolve, reject) => {
      this.pc.addEventListener('track', (e) => {

        for (let s of e.streams) {
          if (ids[s.id])
            this.streams[ids[s.id]] = s;
          else {
            console.log("unexpected stream id");
            reject();
            return;
          }
        }
        if (Object.keys(this.streams).length == Object.keys(ids).length)
          resolve(this.streams);
        else
          console.log("not enough streams, waiting for more");
      });
    });

    this.log(`${this.name} setRemoteDescription start`);
    try {
      await this.pc.setRemoteDescription(desc);
      this.log(`${this.name} setRemoteDescription complete`);
    } catch (e) {
      this.log(`Failed to set session description: ${e.toString()}`);
      throw e;
    }

    this.log(`${this.name} createAnswer start`);
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    try {
      const answer = await this.pc.createAnswer();

      this.log(`${this.name} setLocalDescription start`);
      try {
        await this.pc.setLocalDescription(answer);
        this.log(`${this.name} setLocalDescription complete`);
        this.send_signal({answer});
      } catch (e) {
        this.log(`Failed to set session description: ${e.toString()}`);
        throw e;
      }
    } catch (e) {
      this.log(`Failed to create session description: ${e.toString()}`);
      throw e;
    }

    return result;
  }
}


