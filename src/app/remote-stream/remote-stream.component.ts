import { Component, Input, OnInit } from '@angular/core';

import { RemoteStream, PublishOptions, SubscribeOptions } from 'mywebrtc/dist';

import { MediaStreamHelper } from '../MediaStreamHelper';

@Component({
  selector: 'app-remote-stream',
  templateUrl: './remote-stream.component.html',
  styleUrls: ['./remote-stream.component.css']
})
export class RemoteStreamComponent implements OnInit {

  _publishOptions: PublishOptions = { audio: false, video: false };
  _subscribeOptions: SubscribeOptions = { audio: false, video: false };

  audioEnabled = false;
  videoEnabled = false;

  snapshotSrc?: string;

  _remoteStream: RemoteStream | undefined;
  @Input() set remoteStream(remoteStream: RemoteStream | undefined) {
    this._remoteStream = remoteStream;
    if (this._remoteStream) {

      const l_stream = this._remoteStream;

      this._publishOptions = l_stream.getPublishOptions();
      l_stream.onPublishOptionsUpdate = () => {
        this._publishOptions = l_stream.getPublishOptions();
      };

      this._subscribeOptions = l_stream.getSubscribeOptions();
      l_stream.onSubscribeOptionsUpdate = () => {
        this._subscribeOptions = l_stream.getSubscribeOptions();
      };

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
      this._mediaStream.addEventListener('addtrack', (event: MediaStreamTrackEvent) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|MediaStream::onaddtrack`, event);
        }
        this.doUpdateStates()
      })

      // this._mediaStream.onremovetrack = (event: MediaStreamTrackEvent) => {
      //   if (globalThis.logLevel.isDebugEnabled) {
      //     console.debug(`${this.constructor.name}|MediaStream::onremovetrack`, event);
      //   }
      //   this.doUpdateStates()
      // };
      // Best practice: (https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
      // to be able to register more than one listener
      this._mediaStream.addEventListener('removetrack', (event: MediaStreamTrackEvent) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|MediaStream::onremovetrack`, event);
        }
        this.doUpdateStates()
      })
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
          console.debug(`${this.constructor.name}|took snapshot`, snapshot);
          this.snapshotSrc = URL.createObjectURL(snapshot);
        }
      })
    }
  }

  togglePublishAudio() {
    if (this._remoteStream) {
      const stream = this._remoteStream;
      stream.updatePublishOptions({ audio: !stream.getPublishOptions().audio })
        .then(() => { })
    }
  }

  togglePublishVideo() {
    if (this._remoteStream) {
      const stream = this._remoteStream;
      stream.updatePublishOptions({ video: !stream.getPublishOptions().video })
        .then(() => { })
    }
  }

  toggleSubscribeAudio() {
    if (this._remoteStream) {
      this._remoteStream.updateSubscribeOptions({ audio: !this._remoteStream.getSubscribeOptions().audio })
    }
  }

  toggleSubscribeVideo() {
    if (this._remoteStream) {
      this._remoteStream.updateSubscribeOptions({ video: !this._remoteStream.getSubscribeOptions().video })
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
