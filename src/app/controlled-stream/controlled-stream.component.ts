import { AfterViewInit, Component, ElementRef, HostBinding, Input, OnDestroy, ViewChild } from '@angular/core';
import { StreamVideoComponent } from '../stream-video/stream-video.component';

@Component({
  selector: 'app-controlled-stream',
  standalone: true,
  imports: [StreamVideoComponent],
  templateUrl: './controlled-stream.component.html',
  styleUrl: './controlled-stream.component.css'
})
export class ControlledStreamComponent implements AfterViewInit, OnDestroy {

  _mediaStream: MediaStream | undefined;
  @Input() set mediaStream(mediaStream: MediaStream | undefined) {
    this._mediaStream = mediaStream;
  }

  _videoStyle: { [klass: string]: any; } = {};
  @Input() set videoStyle(style: { [klass: string]: any; }) {
    this._videoStyle = { ...this._videoStyle, ...style };
  }

  _muted = false;
  @Input() set muted(muted: boolean) {
    this._muted = muted;
  }

  @HostBinding("style.--min-height")
  private minHeight: string = '50px';
  @HostBinding("style.--min-width")
  private minWidth: string = '50px';

  @ViewChild('label') label: ElementRef | undefined;
  @ViewChild('controls') controls: ElementRef | undefined;

  // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
  private observer: ResizeObserver | undefined;

  ngAfterViewInit() {
    if (this.label && this.controls) {
      this.observer = new ResizeObserver((entries) => {
        let height = 0, width = 0;
        entries.forEach((entry) => {
          height = Math.max(height, entry.contentRect.height);
          width = Math.max(width, entry.contentRect.width);
        })
        this.minHeight = `${height + 4 * 2}px`;
        this.minWidth = `${width + 4 * 2}px`;
      });
      this.observer.observe(this.label.nativeElement);
      this.observer.observe(this.controls.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      // disconnect() unobserves all observed Element targets of a particular observer.
      this.observer.disconnect();
    }
  }

}
