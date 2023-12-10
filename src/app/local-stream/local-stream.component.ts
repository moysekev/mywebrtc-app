import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { LocalStream } from 'mywebrtc/dist';

import { MediaStreamHelper } from '../MediaStreamHelper';

@Component({
  selector: 'app-local-stream',
  templateUrl: './local-stream.component.html',
  styleUrls: ['./local-stream.component.css']
})
export class LocalStreamComponent implements OnInit {

  _localStream: LocalStream | undefined;
  @Input() set localStream(localStream: LocalStream | undefined) {
    this._localStream = localStream;
    if (this._localStream) {
      this.publishAudio = this._localStream.getPublishOptions().audio;
      this.publishVideo = this._localStream.getPublishOptions().video;

      this.mediaStream = this._localStream.getMediaStream();
    }
  }

  _mediaStream: MediaStream | undefined;
  // @Input() 
  set mediaStream(mediaStream: MediaStream | undefined) {
    this._mediaStream = mediaStream;
    if (this._mediaStream) {
      this.audioEnabled = MediaStreamHelper.isAudioEnabled(this._mediaStream);
      this.videoEnabled = MediaStreamHelper.isVideoEnabled(this._mediaStream);
    }
  }

  audioEnabled = false;
  videoEnabled = false;

  publishAudio = false;
  publishVideo = false

  constructor() { }

  ngOnInit(): void {
  }

  toggleAudio() {
    if (this._mediaStream) {
      if (MediaStreamHelper.isAudioEnabled(this._mediaStream)) {
        MediaStreamHelper.disableAudio(this._mediaStream);
        this.audioEnabled = false;
      } else {
        MediaStreamHelper.enableAudio(this._mediaStream);
        this.audioEnabled = true;
      }
    }
  }

  toggleVideo() {
    if (this._mediaStream) {
      if (MediaStreamHelper.isVideoEnabled(this._mediaStream)) {
        MediaStreamHelper.disableVideo(this._mediaStream);
        this.videoEnabled = false;
      } else {
        MediaStreamHelper.enableVideo(this._mediaStream);
        this.videoEnabled = true;
      }
    }
  }

  togglePublishAudio() {
    if (this._localStream) {
      if (this._localStream.getPublishOptions().audio) {
        this._localStream.updatePublishOptions({ audio: false })
      } else {
        this._localStream.updatePublishOptions({ audio: true })
      }
      this.publishAudio = this._localStream.getPublishOptions().audio;
    }
  }

  togglePublishVideo() {
    if (this._localStream) {
      if (this._localStream.getPublishOptions().video) {
        this._localStream.updatePublishOptions({ video: false })
      } else {
        this._localStream.updatePublishOptions({ video: true })
      }
      this.publishVideo = this._localStream.getPublishOptions().video;
    }
  }

}
