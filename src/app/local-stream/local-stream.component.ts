import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LocalStream, PublishOptions, sendByChunks } from 'mywebrtc';

import { MediaStreamHelper } from '../MediaStreamHelper';
import { DATACHANNEL_SNAPSHOT_PATH } from '../constants';
import { ControlledStreamComponent } from '../controlled-stream/controlled-stream.component';

const CNAME = 'LocalStream';

@Component({
  selector: 'app-local-stream',
  templateUrl: './local-stream.component.html',
  styleUrls: ['./local-stream.component.css'],
  standalone: true,
  imports: [ControlledStreamComponent, MatButtonModule, MatIconModule],
})
export class LocalStreamComponent implements OnInit {

  _publishOptions: PublishOptions = { audio: false, video: false };

  // audioEnabled = false;
  // videoEnabled = false;

  _localStream: LocalStream;
  @Input({ required: true }) set localStream(localStream: LocalStream) {
    this._localStream = localStream;
    if (this._localStream) {
      this._publishOptions = this._localStream.getPublishOptions();
      const l_stream = this._localStream;
      l_stream.onPublishOptionsUpdate(() => {
        this._publishOptions = l_stream.getPublishOptions();
      })

      this.mediaStream = this._localStream.getMediaStream();

      this._localStream.onDataChannel(DATACHANNEL_SNAPSHOT_PATH, (dataChannel: RTCDataChannel) => {
        dataChannel.onopen = () => {
          if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${CNAME}|snapshot datachannel opened, making snapshot`)
          }
          this._localStream.snapshot().then((dataUrl: string) => {
            // https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels
            // Error with:
            // dataChannel.send(dataUrl) // TypeError: RTCDataChannel.send: Message size (534010) exceeds maxMessageSize
            // Divide dataUrl in chunks and send them one by one.
            // let start = 0;
            // while (start < dataUrl.length) {
            //   const end = Math.min(dataUrl.length, start + DATACHANNEL_SNAPSHOT_CHUNK_SIZE);
            //   dataChannel.send(dataUrl.slice(start, end))
            //   start = end;
            // }
            // dataChannel.send(DATACHANNEL_SNAPSHOT_END)
            if (globalThis.logLevel.isDebugEnabled) {
              console.debug(`${CNAME}|snapshot datachannel sending`, dataUrl)
            }
            sendByChunks(dataChannel, dataUrl)
          })
        }
        dataChannel.onclose = () => {
          if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${CNAME}|snapshot datachannel clsed`)
          }
        }
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

  ngOnInit(): void { }

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
