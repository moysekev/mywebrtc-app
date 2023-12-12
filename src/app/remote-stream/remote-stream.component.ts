import { Component, Input, OnInit } from '@angular/core';

import { RemoteStream } from 'mywebrtc/dist';

import { MediaStreamHelper } from '../MediaStreamHelper';

@Component({
  selector: 'app-remote-stream',
  templateUrl: './remote-stream.component.html',
  styleUrls: ['./remote-stream.component.css']
})
export class RemoteStreamComponent implements OnInit {

  publishAudio = false;
  publishVideo = false;

  subscribeAudio = false;
  subscribeVideo = false;

  audioEnabled = false;
  videoEnabled = false;

  snapshotSrc?: string;

  _remoteStream: RemoteStream | undefined;
  @Input() set remoteStream(remoteStream: RemoteStream | undefined) {
    this._remoteStream = remoteStream;
    if (this._remoteStream) {

      this.publishAudio = this._remoteStream.getPublishOptions().audio;
      this.publishVideo = this._remoteStream.getPublishOptions().video;
      const l_stream = this._remoteStream;
      l_stream.onPublishOptionsUpdate = () => {
        this.publishAudio = l_stream.getPublishOptions().audio;
        this.publishVideo = l_stream.getPublishOptions().video;
      };

      this.subscribeAudio = this._remoteStream.getSubscribeOptions().audio;
      this.subscribeVideo = this._remoteStream.getSubscribeOptions().video;

      this.mediaStream = this._remoteStream.getMediaStream();

      this._remoteStream.onMediaStream = (mediaStream: MediaStream) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|onMediaStreamReady`, mediaStream);
        }
        this.mediaStream = mediaStream;
      }
    }
  }

  private doUpdateStates() {
    this.audioEnabled = this._mediaStream ? MediaStreamHelper.isAudioEnabled(this._mediaStream) : false;
    this.videoEnabled = this._mediaStream ? MediaStreamHelper.isVideoEnabled(this._mediaStream) : false;
  }

  _mediaStream: MediaStream | undefined;
  set mediaStream(mediaStream: MediaStream | undefined) {
    this._mediaStream = mediaStream;
    this.doUpdateStates()
    if (this._mediaStream) {
      this._mediaStream.onaddtrack = (event: MediaStreamTrackEvent) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${RemoteStream.name}|MediaStream::onaddtrack`, event);
        }
        this.doUpdateStates()
      };

      this._mediaStream.onremovetrack = (event: MediaStreamTrackEvent) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${RemoteStream.name}|MediaStream::onremovetrack`, event);
        }
        this.doUpdateStates()
      };
    }
  }

  _mirror = false;
  @Input() set mirror(mirror: boolean) {
    this._mirror = mirror;
  }

  _fullscreen = false;
  @Input() set fullscreen(fullscreen: boolean) {
    this._fullscreen = fullscreen;
  }

  constructor() { }

  ngOnInit(): void {

  }

  snapshot() {
    if (this._remoteStream) {
      const stream = this._remoteStream;
      stream.snapshot().then((snapshot) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${RemoteStream.name}|took snapshot`, snapshot);
          this.snapshotSrc = URL.createObjectURL(snapshot);
        }
      })
    }
  }

  togglePublishAudio() {
    if (this._remoteStream) {
      const stream = this._remoteStream;
      stream.updatePublishOptions({ audio: !stream.getPublishOptions().audio })
        .then(() => {
          this.publishAudio = stream.getPublishOptions().audio;
        })
    }
  }

  togglePublishVideo() {
    if (this._remoteStream) {
      const stream = this._remoteStream;
      stream.updatePublishOptions({ video: !stream.getPublishOptions().video })
        .then(() => {
          this.publishVideo = stream.getPublishOptions().video;
        })
    }
  }

  toggleSubscribeAudio() {
    if (this._remoteStream) {
      this._remoteStream.updateSubscribeOptions({ audio: !this._remoteStream.getSubscribeOptions().audio })
      this.subscribeAudio = this._remoteStream.getSubscribeOptions().audio;
    }
  }

  toggleSubscribeVideo() {
    if (this._remoteStream) {
      this._remoteStream.updateSubscribeOptions({ video: !this._remoteStream.getSubscribeOptions().video })
      this.subscribeVideo = this._remoteStream.getSubscribeOptions().video;
    }
  }

  toggleAudio() {
    if (this._mediaStream) {
      if (MediaStreamHelper.isAudioEnabled(this._mediaStream)) {
        MediaStreamHelper.disableAudio(this._mediaStream);
      } else {
        MediaStreamHelper.enableAudio(this._mediaStream);
      }
      this.audioEnabled = MediaStreamHelper.isAudioEnabled(this._mediaStream);
    }
  }

  toggleVideo() {
    if (this._mediaStream) {
      if (MediaStreamHelper.isVideoEnabled(this._mediaStream)) {
        MediaStreamHelper.disableVideo(this._mediaStream);
      } else {
        MediaStreamHelper.enableVideo(this._mediaStream);
      }
      this.videoEnabled = MediaStreamHelper.isVideoEnabled(this._mediaStream);
    }
  }

}
