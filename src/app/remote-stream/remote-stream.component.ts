import { Component, OnInit, Input } from '@angular/core';

import { RemoteStream } from 'mywebrtc/dist';

import { MediaStreamHelper } from '../MediaStreamHelper';

@Component({
  selector: 'app-remote-stream',
  templateUrl: './remote-stream.component.html',
  styleUrls: ['./remote-stream.component.css']
})
export class RemoteStreamComponent implements OnInit {

  _remoteStream: RemoteStream | undefined;
  @Input() set remoteStream(remoteStream: RemoteStream | undefined) {
    this._remoteStream = remoteStream;
  }

  _mediaStream: MediaStream | undefined;
  @Input() set mediaStream(mediaStream: MediaStream | undefined) {
    this._mediaStream = mediaStream;
    if (this._mediaStream) {
      this.audioEnabled = MediaStreamHelper.isAudioEnabled(this._mediaStream);
      this.videoEnabled = MediaStreamHelper.isVideoEnabled(this._mediaStream);
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

  _remoteAudioEnabled: boolean | undefined;
  @Input() set remoteAudioEnabled(remoteAudioEnabled: boolean | undefined) {
    this._remoteAudioEnabled = remoteAudioEnabled;
  }
  _remoteVideoEnabled: boolean | undefined;
  @Input() set remoteVideoEnabled(remoteVideoEnabled: boolean | undefined) {
    this._remoteVideoEnabled = remoteVideoEnabled;
  }

  audioEnabled = false;
  videoEnabled = false;

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
    }
    if (this._remoteStream) {
      const subscribeOptions = this._remoteStream.getSubscribeOptions();
      if (this.audioEnabled) {
        this._remoteStream.updateSubscribeOptions({ audio: false, video: subscribeOptions.video })
      } else {
        this._remoteStream.updateSubscribeOptions({ audio: true, video: subscribeOptions.video })
      }
    }
    this.audioEnabled = !this.audioEnabled;
  }

  toggleVideo() {
    if (this._mediaStream) {
      if (MediaStreamHelper.isVideoEnabled(this._mediaStream)) {
        MediaStreamHelper.disableVideo(this._mediaStream);
      } else {
        MediaStreamHelper.enableVideo(this._mediaStream);
      }
    }
    if (this._remoteStream) {
      const subscribeOptions = this._remoteStream.getSubscribeOptions();
      if (this.videoEnabled) {
        this._remoteStream.updateSubscribeOptions({ audio: subscribeOptions.audio, video: false })
      } else {
        this._remoteStream.updateSubscribeOptions({ audio: subscribeOptions.audio, video: true })
      }
    }
    this.videoEnabled = !this.videoEnabled;
  }

}
