import { Component, Input, Output, ViewChild, ElementRef, AfterViewInit, EventEmitter } from '@angular/core';

import { MediaStreamHelper } from '../MediaStreamHelper';

@Component({
  selector: 'app-stream-video',
  templateUrl: './stream-video.component.html',
  styleUrls: ['./stream-video.component.css']
})
export class StreamVideoComponent implements AfterViewInit {

  @ViewChild("video") videoRef: ElementRef | undefined;

  _mediaStream: MediaStream | undefined;
  @Input() set mediaStream(mediaStream: MediaStream | undefined) {
    this._mediaStream = mediaStream;
    if (this.videoRef) {
      this.videoRef.nativeElement.srcObject = this._mediaStream;
      this.videoRef.nativeElement.muted = false;
    }
    if (this._mediaStream) {
      this.audioEnabled = MediaStreamHelper.isAudioEnabled(this._mediaStream);
      this.videoEnabled = MediaStreamHelper.isVideoEnabled(this._mediaStream);
    }
  }

  _remoteAudioEnabled: boolean | undefined;
  @Input() set remoteAudioEnabled(remoteAudioEnabled: boolean | undefined) {
    this._remoteAudioEnabled = remoteAudioEnabled;
  }

  _mirror = false;
  @Input() set mirror(mirror: boolean) {
    this._mirror = mirror;
  }

  _fullscreen = false;
  @Input() set fullscreen(fullscreen: boolean) {
    this._fullscreen = fullscreen;
  }

  @Output() onAudioEnabled = new EventEmitter<boolean>();
  @Output() onVideoEnabled = new EventEmitter<boolean>();

  audioEnabled = false;
  videoEnabled = false;

  ngAfterViewInit() {
    console.log('StreamVideoComponent::ngAfterViewInit', this.videoRef);
    // remote stream is attached to DOM during ngAfterViewInit because @ViewChild is not bound before this stage
    if (this.videoRef) {
      this.videoRef.nativeElement.srcObject = this._mediaStream;
      this.videoRef.nativeElement.muted = false;
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
      this.onAudioEnabled.emit(this.audioEnabled);
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
      this.onVideoEnabled.emit(this.videoEnabled);
    }
  }

}
