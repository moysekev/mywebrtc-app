import { Component, Input, OnInit } from '@angular/core';

import { RemoteStream } from 'mywebrtc/dist';

import { MediaStreamHelper } from '../MediaStreamHelper';

@Component({
  selector: 'app-remote-stream',
  templateUrl: './remote-stream.component.html',
  styleUrls: ['./remote-stream.component.css']
})
export class RemoteStreamComponent implements OnInit {

  remoteAudioEnabled = false;
  remoteVideoEnabled = false;

  _remoteStream: RemoteStream | undefined;
  @Input() set remoteStream(remoteStream: RemoteStream | undefined) {
    this._remoteStream = remoteStream;
    if (this._remoteStream) {
      this.remoteAudioEnabled = this._remoteStream.getSubscribeOptions().audio;
      this.remoteVideoEnabled = this._remoteStream.getSubscribeOptions().video;
    }
  }

  audioEnabled = false;
  videoEnabled = false;

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

  // _remoteAudioEnabled: boolean | undefined;
  // @Input() set remoteAudioEnabled(remoteAudioEnabled: boolean | undefined) {
  //   this._remoteAudioEnabled = remoteAudioEnabled;
  // }
  // _remoteVideoEnabled: boolean | undefined;
  // @Input() set remoteVideoEnabled(remoteVideoEnabled: boolean | undefined) {
  //   this._remoteVideoEnabled = remoteVideoEnabled;
  // }

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
