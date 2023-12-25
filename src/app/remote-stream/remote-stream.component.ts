import { NgFor } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PublishOptions, RemoteStream, SubscribeOptions } from 'mywebrtc';

import { MediaStreamHelper } from '../MediaStreamHelper';
import { ContextService } from '../context.service';
import { ControlledStreamComponent } from '../controlled-stream/controlled-stream.component';

@Component({
  selector: 'app-remote-stream',
  templateUrl: './remote-stream.component.html',
  styleUrls: ['./remote-stream.component.css'],
  standalone: true,
  imports: [NgFor, ControlledStreamComponent, MatButtonModule, MatIconModule]
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

  _remoteStream: RemoteStream | undefined;
  @Input({ required: true }) set remoteStream(remoteStream: RemoteStream) {

    this._remoteStream = remoteStream;
    this._remoteStream.getParticipant().getUser().onUserDataUpdate(this.on_userDataUpdate);

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
        console.debug(`${this.constructor.name}|onMediaStreamReady`, mediaStream);
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
          console.debug(`${this.constructor.name}|MediaStream::onaddtrack`, event);
        }
        this.doUpdateStates()
      })

      // this._mediaStream.onremovetrack = (event: MediaStreamTrackEvent) => {
      //   if (globalThis.logLevel.isDebugEnabled) {
      //     console.debug(`${this.constructor.name}|MediaStream::onremovetrack`, event);
      //   }
      //   this.doUpdateStates()
      // };
      // Best practice: (https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
      // to be able to register more than one listener
      this._mediaStream.addEventListener('removetrack', (event: MediaStreamTrackEvent) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|MediaStream::onremovetrack`, event);
        }
        this.doUpdateStates()
      })
    }
  }

  dataChannel?: RTCDataChannel;

  constructor(private el: ElementRef,
    // private authService: AuthService,
    private contextService: ContextService
  ) { }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    if (this._remoteStream) {
      this._remoteStream.getParticipant().getUser().offUserDataUpdate(this.on_userDataUpdate);
    }
  }

  onPointerEnter(event: PointerEvent) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${this.constructor.name}|onPointerEnter`, event)
    }

    if (this._remoteStream) {
      const dataChannel = this._remoteStream.getOrCreateDataChannel();
      dataChannel.onopen = () => {
        // send first message indicating the pointer location that will be sent next
        // comes from the current user
        // dataChannel.send(JSON.stringify({ nickname: this.authService.user?.isAnonymous ? "anonymous" : this.authService.user?.displayName }))
        dataChannel.send(JSON.stringify({ nickname: this.contextService.nickname }))

        this.dataChannel = dataChannel;
      };
    }
  }

  onPointerMove(event: PointerEvent) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events

    if (this.dataChannel) {
      // const x = event.clientX - (this.el.nativeElement.offsetLeft ?? 0);
      // const y = event.clientY - (this.el.nativeElement.offsetTop ?? 0);
      const rect = this.el.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left; //x position within the element.
      const y = event.clientY - rect.top;  //y position within the element.
      // const left = `${Math.round(x * 100 / (this.el.nativeElement.clientWidth || 100))}%`;
      // const top = `${Math.round(y * 100 / (this.el.nativeElement.clientHeight || 100))}%`;

      // Round with 2 decimal to reduce amount of data sent on the datachannel, still keeping enough accuracy
      // Math.round((num + Number.EPSILON) * 100) / 100
      // console.log('onPointerMove', x, this.el.nativeElement.clientWidth)
      function round2(num: number) {
        return Math.round((num + Number.EPSILON) * 100) / 100
      }
      const left = round2(x * 100 / (this.el.nativeElement.clientWidth || 100));
      const top = round2(y * 100 / (this.el.nativeElement.clientHeight || 100));

      // if (globalThis.logLevel.isDebugEnabled) {
      //   console.log('onPointerMove', event,
      //     this.el.nativeElement.offsetLeft, this.el.nativeElement.offsetTop,
      //     this.el.nativeElement.clientWidth, this.el.nativeElement.clientHeight,
      //     left, top)
      // }
      this.dataChannel.send(JSON.stringify({ left, top }))
    }

  }

  onPointerLeave(event: PointerEvent) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
    if (globalThis.logLevel.isDebugEnabled) {
      console.log('onPointerLeave', event, this.dataChannel)
    }
    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = undefined;
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
    if (this._remoteStream) {
      const stream = this._remoteStream;
      stream.snapshot().then((dataUrl) => {
        this.onSnapshot.emit(dataUrl);
      })
    }
  }

  togglePublishAudio() {
    if (this._remoteStream) {
      const stream = this._remoteStream;
      stream.updatePublishOptions({ audio: !stream.getPublishOptions().audio })
        .then(() => { })
    }
  }

  togglePublishVideo() {
    if (this._remoteStream) {
      const stream = this._remoteStream;
      stream.updatePublishOptions({ video: !stream.getPublishOptions().video })
        .then(() => { })
    }
  }

  toggleSubscribeAudio() {
    if (this._remoteStream) {
      this._remoteStream.updateSubscribeOptions({ audio: !this._remoteStream.getSubscribeOptions().audio })
    }
  }

  toggleSubscribeVideo() {
    if (this._remoteStream) {
      this._remoteStream.updateSubscribeOptions({ video: !this._remoteStream.getSubscribeOptions().video })
    }
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
