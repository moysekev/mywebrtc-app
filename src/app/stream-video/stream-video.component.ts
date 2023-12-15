import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgStyle, NgClass } from '@angular/common';

export const VIDEO_ROUNDED_CORNERS = { borderRadius: '4px', overflow: 'hidden' };
// const VIDEO_SIZING = { height: '100%', width: '100%' };

@Component({
  selector: 'app-stream-video',
  templateUrl: './stream-video.component.html',
  styleUrls: ['./stream-video.component.css'],
  standalone: true,
  imports: [NgStyle, NgClass]
})
export class StreamVideoComponent implements AfterViewInit {

  @ViewChild("video") videoRef: ElementRef | undefined;

  _mediaStream: MediaStream | undefined;
  @Input() set mediaStream(mediaStream: MediaStream | undefined) {
    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${this.constructor.name}|set mediaStream`, mediaStream, mediaStream?.getTracks().length);
    }
    this._mediaStream = mediaStream;
    this.doAttach();
  }

  _videoStyle: { [klass: string]: any; } = {
    height: '100%', width: '100%',
    'object-fit': 'contain',
    ...VIDEO_ROUNDED_CORNERS
  };
  @Input() set videoStyle(style: { [klass: string]: any; }) {
    this._videoStyle = { ...this._videoStyle, ...style };
  }

  _muted = false;
  @Input() set muted(muted: boolean) {
    this._muted = muted;
  }

  _mirror = false;
  @Input() set mirror(mirror: boolean) {
    this._mirror = mirror;
  }

  _fullscreen = false;
  @Input() set fullscreen(fullscreen: boolean) {
    this._fullscreen = fullscreen;
  }

  ngAfterViewInit() {
    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${this.constructor.name}|ngAfterViewInit`, this.videoRef);
    }
    // remote stream is attached to DOM during ngAfterViewInit because @ViewChild is not bound before this stage
    this.doAttach();
  }

  doAttach() {
    if (this.videoRef) {
      this.videoRef.nativeElement.srcObject = this._mediaStream;
      this.videoRef.nativeElement.muted = this._muted;
      // this.videoRef.nativeElement.height = '150';
      // this.videoRef.nativeElement.width = '200';
    }
  }


}
