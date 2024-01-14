import { NgClass, NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';

export const VIDEO_ROUNDED_CORNERS = { borderRadius: '4px', overflow: 'hidden' };

const CNAME = 'StreamVideo';

@Component({
  selector: 'app-stream-video',
  templateUrl: './stream-video.component.html',
  styleUrls: ['./stream-video.component.css'],
  standalone: true,
  imports: [NgStyle, NgClass]
})
export class StreamVideoComponent { //implements AfterViewInit, OnDestroy

  // @ViewChild("video") videoRef: ElementRef | undefined;

  _mediaStream: MediaStream | undefined;
  @Input() set mediaStream(mediaStream: MediaStream | undefined) {
    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${CNAME}|mediaStream`, mediaStream, mediaStream?.getTracks().length);
    }
    this._mediaStream = mediaStream;
    // if (this.videoRef) {
    //   this.videoRef.nativeElement.srcObject = mediaStream;
    // }
  }

  _videoStyle: { [klass: string]: any; } = {
    // minHeight: '100%', minWidth: '100%',
    // width: '99vw', height: '75vw',
    //  maxWidth: '133.34vh', maxHeight: '100vh',
    'object-fit': 'contain',
    ...VIDEO_ROUNDED_CORNERS
  };
  @Input() set videoStyle(style: { [klass: string]: any; }) {
    this._videoStyle = { ...this._videoStyle, ...style };
  }

  _muted = false;
  @Input() set muted(muted: boolean) {
    this._muted = muted;
    // if (this.videoRef) {
    //   this.videoRef.nativeElement.muted = this._muted;
    // }
  }

  _mirror = false;
  @Input() set mirror(mirror: boolean) {
    this._mirror = mirror;
  }

  _fullscreen = false;
  @Input() set fullscreen(fullscreen: boolean) {
    this._fullscreen = fullscreen;
  }

  // ngAfterViewInit() {
  //   if (globalThis.logLevel.isDebugEnabled) {
  //     console.debug(`${CNAME}|ngAfterViewInit`, this.videoRef);
  //   }
  //   // remote stream is attached to DOM during ngAfterViewInit because @ViewChild is not bound before this stage
  //   // this.doAttach();
  // }

  // ngOnDestroy(): void {
  //   if (globalThis.logLevel.isDebugEnabled) {
  //     console.debug(`${CNAME}|ngOnDestroy`, this.videoRef);
  //   }
  //   // throw new Error('Method not implemented.');
  //   if (this.videoRef) {
  //     this.videoRef.nativeElement.srcObject = undefined;
  //   }
  // }

  // doAttach() {
  //   if (this.videoRef) {
  //     const video = this.videoRef.nativeElement;
  //     video.srcObject = this._mediaStream;
  //   }
  // }
}
