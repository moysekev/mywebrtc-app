import { Component, OnInit, Input, Output,EventEmitter  } from '@angular/core';

import { MediaStreamHelper } from '../MediaStreamHelper';

@Component({
  selector: 'app-local-stream',
  templateUrl: './local-stream.component.html',
  styleUrls: ['./local-stream.component.css']
})
export class LocalStreamComponent implements OnInit {

  _mediaStream: MediaStream | undefined;
  @Input() set mediaStream(mediaStream: MediaStream | undefined) {
    this._mediaStream = mediaStream;
    if (this._mediaStream) {
      this.audioEnabled = MediaStreamHelper.isAudioEnabled(this._mediaStream);
      this.videoEnabled = MediaStreamHelper.isVideoEnabled(this._mediaStream);
    }
  }

  @Output() onTracksStatusChanged = new EventEmitter<void>();

  audioEnabled = false;
  videoEnabled = false;

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
      this.onTracksStatusChanged.emit();
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
      this.onTracksStatusChanged.emit();
    }
  }

}
