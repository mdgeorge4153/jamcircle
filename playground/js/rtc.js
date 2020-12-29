'use strict';

/**
 * Source:
 *              // send_signal(msg) will not be called until after
 *              // recv_signal(msg) has been called; this means you don't have to
 *              // ensure that the sink is ready to receive messages
 *    constructor  : tracks * send_signal * config? -> source
 *    createOffer  : source -> offer
 *    recv_signal  : source * message -> ()
 *    close        : source -> ()
 *
 * Sink:
 *    constructor : offer * send_signal * config? -> sink
 *    tracks      : sink -> tracks promise
 *    recv_signal : sink * message -> ()
 *    close       : sink -> ()
 */

let default_configuration = {
  log: (msg) => msg,
}

class VideoConnection {
  constructor(configuration, send_signal) {
    this.pc = new RTCPeerConnection(configuration);
    this.pc.addEventListener('icecandidate', e => this._onIceCandidate(e));
    this.pc.addEventListener('iceconnectionstatechange', e => this._onIceStateChange(e));
    this.log      = (msg) => msg;
    this.send_signal = send_signal;
    this.can_send = false;

    this.name = configuration.name;
  }

  recv_signal(msg) {
    if (msg.candidate)
      return this._addIceCandidate(msg.candidate);
    else
      this.log('unexpected message: ', msg);
  }

  close() {
    this.pc.close();
    this.pc = null;
  }

  async _addIceCandidate(candidate) {
    try {
      await this.pc.addIceCandidate(candidate);
      this.log(`${this.name} addIceCandidate success`);
    } catch (e) {
      this.log(`${this.name} failed to add ICE Candidate: ${e.toString()}`);
      throw e;
    }
  }

  async _onIceCandidate(event) {
    try {
      await this.send_signal({candidate: event.candidate});
      this.log(`${this.name} addIceCandidate success`);
    } catch (e) {
      this.log(`${this.name} failed to add ICE Candidate: ${e.toString()}`);
      throw e;
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
  constructor(config, send_signal, streams) {
    super({name: 'source', ...config}, send_signal);
    this.streams = streams;
  }

  recv_signal(msg) {
    if (msg.answer)
      return this.setAnswer(msg.answer);
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

  async setAnswer(answer) {
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
  constructor(config, send_signal, gotRemoteTrack) {
    super({name: 'sink', ...config}, send_signal);
    this.pc.addEventListener('track', (e) => this._gotRemoteStream(e));
    this.gotRemoteTrack = gotRemoteTrack;
    this.ids = null;
  }

  _gotRemoteStream(e) {
    for (let s of e.streams)
      console.log(this.ids[s.id]);
    for (let track of e.streams[0].getTracks())
      this.gotRemoteTrack(track);
  }

  async createAnswer({offer: desc, ids}) {
    this.ids = ids;
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

      return answer;
    } catch (e) {
      this.log(`Failed to create session description: ${e.toString()}`);
      throw e;
    }
  }
}


