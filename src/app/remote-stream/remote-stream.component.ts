import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PublishOptions, RemoteStream, SubscribeOptions } from 'mywebrtc';

import { MediaStreamHelper } from '../MediaStreamHelper';
import { DATACHANNEL_SNAPSHOT_END, DATACHANNEL_SNAPSHOT_PATH } from '../constants';
import { ControlledStreamComponent } from '../controlled-stream/controlled-stream.component';

const COMPONENT_NAME = 'RemoteStream';
@Component({
  selector: 'app-remote-stream',
  templateUrl: './remote-stream.component.html',
  styleUrls: ['./remote-stream.component.css'],
  standalone: true,
  imports: [ControlledStreamComponent, MatButtonModule, MatIconModule]
})
export class RemoteStreamComponent implements OnInit, OnDestroy {

  _publishOptions: PublishOptions = { audio: false, video: false };
  _subscribeOptions: SubscribeOptions = { audio: false, video: false };

  audioEnabled = false;
  videoEnabled = false;

  _nickname = '';
  on_userDataUpdate = (userData: any) => {
    this._nickname = userData.nickname;
  };

  _remoteStream: RemoteStream;
  @Input({ required: true }) set remoteStream(remoteStream: RemoteStream) {

    this._remoteStream = remoteStream;
    this._remoteStream.getParticipant().user.onUserDataUpdate(this.on_userDataUpdate);

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
    this._remoteStream.onMediaStream((mediaStream: MediaStream) => {
      if (globalThis.logLevel.isDebugEnabled) {
        console.debug(`${COMPONENT_NAME}|onMediaStreamReady`, mediaStream);
      }
      this.mediaStream = mediaStream;
    })
  }

  _videoStyle: { [klass: string]: any; } = {};
  @Input() set videoStyle(style: { [klass: string]: any; }) {
    this._videoStyle = { ...this._videoStyle, ...style };
  }

  _mirror = false;
  @Input() set mirror(mirror: boolean) {
    this._mirror = mirror;
  }

  // _fullscreen = false;
  // @Input() set fullscreen(fullscreen: boolean) {
  //   this._fullscreen = fullscreen;
  // }

  @Output() onSnapshot = new EventEmitter<string>();

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
          console.debug(`${COMPONENT_NAME}|MediaStream::onaddtrack`, event);
        }
        this.doUpdateStates()
      })

      // this._mediaStream.onremovetrack = (event: MediaStreamTrackEvent) => {
      //   if (globalThis.logLevel.isDebugEnabled) {
      //     console.debug(`${COMPONENT_NAME}|MediaStream::onremovetrack`, event);
      //   }
      //   this.doUpdateStates()
      // };
      // Best practice: (https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
      // to be able to register more than one listener
      this._mediaStream.addEventListener('removetrack', (event: MediaStreamTrackEvent) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${COMPONENT_NAME}|MediaStream::onremovetrack`, event);
        }
        this.doUpdateStates()
      })
    }
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    if (this._remoteStream) {
      this._remoteStream.getParticipant().user.offUserDataUpdate(this.on_userDataUpdate);
    }
  }

  // onPointerDown(event: PointerEvent) {
  //   // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
  //   if (globalThis.logLevel.isDebugEnabled) {
  //     console.log('onPointerDown', event)
  //   }
  //   this._remoteStream?.sendData({ x: event.clientX, y: event.clientY })
  // }

  snapshot() {
    // this._remoteStream?.snapshot().then((dataUrl) => {
    //   this.onSnapshot.emit(dataUrl);
    // })
    this._remoteStream?.singlecast(DATACHANNEL_SNAPSHOT_PATH, (dataChannel) => {
      dataChannel.onopen = (event) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${COMPONENT_NAME}|snapshot dataChannel.onopen`, this, event);
        }
      };

      // receive data by chunks, rebuilding dataUrl string
      let dataUrl = '';
      dataChannel.onmessage = (event: MessageEvent) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${COMPONENT_NAME}|snapshot dataChannel.onmessage`, this, event);
        }
        if (event.data === DATACHANNEL_SNAPSHOT_END) {
          // resolve(dataUrl);
          this.onSnapshot.emit(dataUrl);
          dataChannel.close();
        } else {
          dataUrl += event.data;
        }
      };

    })
  }

  togglePublishAudio() {
    // if (this._remoteStream) {
    //   const stream = this._remoteStream;
    this._remoteStream?.updatePublishOptions({ audio: !this._remoteStream.getPublishOptions().audio })
      .then(() => { })
    // }
  }

  togglePublishVideo() {
    this._remoteStream?.updatePublishOptions({ video: !this._remoteStream.getPublishOptions().video })
      .then(() => { })
  }

  toggleSubscribeAudio() {
    this._remoteStream?.updateSubscribeOptions({ audio: !this._remoteStream.getSubscribeOptions().audio })
  }

  toggleSubscribeVideo() {
    this._remoteStream?.updateSubscribeOptions({ video: !this._remoteStream.getSubscribeOptions().video })
  }

  // toggleAudio() {
  //   if (this._mediaStream) {
  //     if (MediaStreamHelper.isAudioEnabled(this._mediaStream)) {
  //       MediaStreamHelper.disableAudio(this._mediaStream);
  //     } else {
  //       MediaStreamHelper.enableAudio(this._mediaStream);
  //     }
  //     this.audioEnabled = MediaStreamHelper.isAudioEnabled(this._mediaStream);
  //   }
  // }

  // toggleVideo() {
  //   if (this._mediaStream) {
  //     if (MediaStreamHelper.isVideoEnabled(this._mediaStream)) {
  //       MediaStreamHelper.disableVideo(this._mediaStream);
  //     } else {
  //       MediaStreamHelper.enableVideo(this._mediaStream);
  //     }
  //     this.videoEnabled = MediaStreamHelper.isVideoEnabled(this._mediaStream);
  //   }
  // }

}
