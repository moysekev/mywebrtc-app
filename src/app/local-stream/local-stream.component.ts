import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LocalStream, PublishOptions } from 'mywebrtc';

import { MediaStreamHelper } from '../MediaStreamHelper';
import { ControlledStreamComponent } from '../controlled-stream/controlled-stream.component';

@Component({
  selector: 'app-local-stream',
  templateUrl: './local-stream.component.html',
  styleUrls: ['./local-stream.component.css'],
  standalone: true,
  imports: [ControlledStreamComponent, MatButtonModule, MatIconModule],
})
export class LocalStreamComponent implements OnInit {

  @ViewChild('pointer') pointer: ElementRef | undefined;

  _publishOptions: PublishOptions = { audio: false, video: false };

  // audioEnabled = false;
  // videoEnabled = false;

  _localStream: LocalStream | undefined;
  @Input({ required: true }) set localStream(localStream: LocalStream) {
    this._localStream = localStream;
    if (this._localStream) {
      this._publishOptions = this._localStream.getPublishOptions();
      const l_stream = this._localStream;
      l_stream.onPublishOptionsUpdate(() => {
        this._publishOptions = l_stream.getPublishOptions();
      })

      this.mediaStream = this._localStream.getMediaStream();

      this._localStream.onDataChannel((dataChannel: RTCDataChannel) => {
        // TODO create a pointer for this datachannel only
        // TODO how do we know this is for a pointer ?
        // TODO how do we know who is doing it ?
        dataChannel.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (this.pointer) {
            this.pointer.nativeElement.style.left = data.left;//`${data.x}px`;
            this.pointer.nativeElement.style.top = data.top;// `${data.y}px`;
          }
        };
      })
    }
  }

  _videoStyle: { [klass: string]: any; } = {};
  @Input() set videoStyle(style: { [klass: string]: any; }) {
    this._videoStyle = { ...this._videoStyle, ...style };
  }

  _mediaStream: MediaStream | undefined;
  set mediaStream(mediaStream: MediaStream | undefined) {
    this._mediaStream = mediaStream;
    // if (this._mediaStream) {
    //   this.audioEnabled = MediaStreamHelper.isAudioEnabled(this._mediaStream);
    //   this.videoEnabled = MediaStreamHelper.isVideoEnabled(this._mediaStream);
    // }
  }

  constructor() { }

  ngOnInit(): void {
  }

  togglePublishAudio() {
    if (this._localStream) {
      if (this._localStream.getPublishOptions().audio) {
        MediaStreamHelper.disableAudio(this._localStream.getMediaStream());
      } else {
        MediaStreamHelper.enableAudio(this._localStream.getMediaStream());
      }
      this._localStream.updatePublishOptions({ audio: !this._localStream.getPublishOptions().audio })
        .then(() => { })
    }
  }

  togglePublishVideo() {
    if (this._localStream) {
      if (this._localStream.getPublishOptions().video) {
        MediaStreamHelper.disableVideo(this._localStream.getMediaStream());
      } else {
        MediaStreamHelper.enableVideo(this._localStream.getMediaStream());
      }
      this._localStream.updatePublishOptions({ video: !this._localStream.getPublishOptions().video })
        .then(() => { })
    }
  }

  // toggleAudio() {
  //   if (this._mediaStream) {
  //     if (MediaStreamHelper.isAudioEnabled(this._mediaStream)) {
  //       MediaStreamHelper.disableAudio(this._mediaStream);
  //       this.audioEnabled = false;
  //     } else {
  //       MediaStreamHelper.enableAudio(this._mediaStream);
  //       this.audioEnabled = true;
  //     }
  //   }
  // }

  // toggleVideo() {
  //   if (this._mediaStream) {
  //     if (MediaStreamHelper.isVideoEnabled(this._mediaStream)) {
  //       MediaStreamHelper.disableVideo(this._mediaStream);
  //       this.videoEnabled = false;
  //     } else {
  //       MediaStreamHelper.enableVideo(this._mediaStream);
  //       this.videoEnabled = true;
  //     }
  //   }
  // }

}
