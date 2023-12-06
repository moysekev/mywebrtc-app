import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-stream-video',
  templateUrl: './stream-video.component.html',
  styleUrls: ['./stream-video.component.css']
})
export class StreamVideoComponent implements AfterViewInit {

  @ViewChild("video") videoRef: ElementRef | undefined;

  _mediaStream: MediaStream | undefined;
  @Input() set mediaStream(mediaStream: MediaStream | undefined) {
    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${this.constructor.name}|set mediaStream`, mediaStream);
    }
    this._mediaStream = mediaStream;
    this.doAttach();
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
