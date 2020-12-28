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
  log: console.log,
}

class VideoConnection {
  constructor(configuration, send) {
    this.pc = new RTCPeerConnection(configuration);
    this.pc.addEventListener('icecandidate', e => this._onIceCandidate(e));
    this.pc.addEventListener('iceconnectionstatechange', e => this._onIceStateChange(e));
    this.log      = console.log;
    this.send     = send;
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
      await this.send({candidate: event.candidate});
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
  constructor(config, send, tracks) {
    super({name: 'source', ...config}, send);
    tracks.forEach((track) => this.addTrack(track));
  }

  recv_signal(msg) {
    if (msg.answer)
      return this.setAnswer(msg.answer);
    else
      return super.recv_signal(msg);
  }

  addTrack(track) {
    this.log(track);
    track.contentHint="hello hello";
    this.pc.addTrack(track, new MediaStream());
  }

  async createOffer() {
    try {
      this.log(`${this.name} createOffer start`);
      const desc = await this.pc.createOffer(offerOptions);

      this.log(`${this.name} setLocalDescription start`);
      try {
        await this.pc.setLocalDescription(desc);
        this.log(`${this.name} setLocalDescription complete`);
      } catch (e) {
        this.log(`Failed to set session description: ${e.toString()}`);
        throw e;
      }

      return desc;
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
  constructor(config, send, gotRemoteStream) {
    super({name: 'sink', ...config}, send);
    this.pc.addEventListener('track', gotRemoteStream);
  }

  async createAnswer(desc) {
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
        return answer;
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


