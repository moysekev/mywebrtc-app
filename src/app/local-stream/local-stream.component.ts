import { Component, Input, OnInit } from '@angular/core';

import { LocalStream } from 'mywebrtc/dist';

import { MediaStreamHelper } from '../MediaStreamHelper';

@Component({
  selector: 'app-local-stream',
  templateUrl: './local-stream.component.html',
  styleUrls: ['./local-stream.component.css']
})
export class LocalStreamComponent implements OnInit {

  publishAudio = false;
  publishVideo = false;

  audioEnabled = false;
  videoEnabled = false;

  _localStream: LocalStream | undefined;
  @Input() set localStream(localStream: LocalStream | undefined) {
    this._localStream = localStream;
    if (this._localStream) {
      this.publishAudio = this._localStream.getPublishOptions().audio;
      this.publishVideo = this._localStream.getPublishOptions().video;
      const l_stream = this._localStream;
      l_stream.onPublishOptionsUpdate = () => {
        this.publishAudio = l_stream.getPublishOptions().audio;
        this.publishVideo = l_stream.getPublishOptions().video;
      };

      this.mediaStream = this._localStream.getMediaStream();
    }
  }

  _videoStyle: { [klass: string]: any; } = {};
  @Input() set videoStyle(style: { [klass: string]: any; }) {
    this._videoStyle = { ...this._videoStyle, ...style };
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

  constructor() { }

  ngOnInit(): void {
  }

  togglePublishAudio() {
    if (this._localStream) {
      const localStream = this._localStream;
      this._localStream.updatePublishOptions({ audio: !this._localStream.getPublishOptions().audio })
        .then(() => {
          this.publishAudio = localStream.getPublishOptions().audio;
        })
    }
  }

  togglePublishVideo() {
    if (this._localStream) {
      const localStream = this._localStream;
      this._localStream.updatePublishOptions({ video: !this._localStream.getPublishOptions().video })
        .then(() => {
          this.publishVideo = localStream.getPublishOptions().video;
        })
    }
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

}
