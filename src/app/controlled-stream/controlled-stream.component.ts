import { AfterViewInit, Component, ElementRef, HostBinding, Input, ViewChild } from '@angular/core';
import { StreamVideoComponent } from '../stream-video/stream-video.component';

@Component({
  selector: 'app-controlled-stream',
  standalone: true,
  imports: [StreamVideoComponent],
  templateUrl: './controlled-stream.component.html',
  styleUrl: './controlled-stream.component.css'
})
export class ControlledStreamComponent implements AfterViewInit {

  _mediaStream: MediaStream | undefined;
  @Input() set mediaStream(mediaStream: MediaStream | undefined) {
    this._mediaStream = mediaStream;
  }

  @HostBinding("style.--min-height")
  private minHeight: string = '50px';
  @HostBinding("style.--min-width")
  private minWidth: string = '50px';

  @ViewChild('controls') controls: ElementRef | undefined;


  private observer: ResizeObserver | undefined;

  ngAfterViewInit() {
    if (this.controls) {
      this.observer = new ResizeObserver(() => {
        this.minHeight = `${this.controls?.nativeElement.clientHeight + 4 * 2}px`;
        this.minWidth = `${this.controls?.nativeElement.clientWidth + 4 * 2}px`;
      });
      this.observer.observe(this.controls.nativeElement);
    }
  }

}
