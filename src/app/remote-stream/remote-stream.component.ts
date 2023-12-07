import { Component, Input, OnInit } from '@angular/core';

import { RemoteStream } from 'mywebrtc/dist';

import { MediaStreamHelper } from '../MediaStreamHelper';

@Component({
  selector: 'app-remote-stream',
  templateUrl: './remote-stream.component.html',
  styleUrls: ['./remote-stream.component.css']
})
export class RemoteStreamComponent implements OnInit {

  audioEnabled = false;
  videoEnabled = false;

  remoteAudioEnabled = false;
  remoteVideoEnabled = false;

  _remoteStream: RemoteStream | undefined;
  @Input() set remoteStream(remoteStream: RemoteStream | undefined) {
    this._remoteStream = remoteStream;
    if (this._remoteStream) {
      this.remoteAudioEnabled = this._remoteStream.getSubscribeOptions().audio;
      this.remoteVideoEnabled = this._remoteStream.getSubscribeOptions().video;

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
        console.log(`${RemoteStream.name}|MediaStream::onaddtrack`, event);
        this.doUpdateStates()
      };

      this._mediaStream.onremovetrack = (event: MediaStreamTrackEvent) => {
        console.log(`${RemoteStream.name}|MediaStream::onremovetrack`, event);
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

  toggleRemoteAudio() {
    if (this._remoteStream) {
      if (this._remoteStream.getSubscribeOptions().audio) {
        this._remoteStream.updateSubscribeOptions({ audio: false })
      } else {
        this._remoteStream.updateSubscribeOptions({ audio: true })
      }
      this.remoteAudioEnabled = this._remoteStream.getSubscribeOptions().audio;
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

  toggleRemoteVideo() {
    if (this._remoteStream) {
      if (this._remoteStream.getSubscribeOptions().video) {
        this._remoteStream.updateSubscribeOptions({ video: false })
      } else {
        this._remoteStream.updateSubscribeOptions({ video: true })
      }
      this.remoteVideoEnabled = this._remoteStream.getSubscribeOptions().video;
    }
  }

}
