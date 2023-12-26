import { KeyValuePipe, NgFor } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostBinding, Input, OnDestroy, ViewChild } from '@angular/core';
import { Stream } from 'mywebrtc/dist/Stream';
import { PointerComponent } from '../pointer/pointer.component';
import { StreamVideoComponent } from '../stream-video/stream-video.component';

@Component({
  selector: 'app-controlled-stream',
  standalone: true,
  imports: [NgFor, KeyValuePipe, StreamVideoComponent, PointerComponent],
  templateUrl: './controlled-stream.component.html',
  styleUrl: './controlled-stream.component.css'
})
export class ControlledStreamComponent implements AfterViewInit, OnDestroy {

  // store pointers dataChannels with corresponding nickname
  pointerChannels: Map<RTCDataChannel, string> = new Map();

  _stream: Stream;
  @Input({ required: true }) set stream(stream: Stream) {
    this._stream = stream;

    this._stream.onDataChannel((dataChannel: RTCDataChannel) => {
      // DONE create a pointer each datachannel
      // TODO how do we know this is for a pointer ?
      // DONE: how do we know who is sending his pointer ? => first message contains nickname, next ones will be {top, left}

      // Wait for first message with nickname info before adding in the Map
      // This will trigger Pointer component creation that will override
      // the onmessage, listening on pointer location update only.
      dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.nickname !== undefined) {
          this.pointerChannels.set(dataChannel, data.nickname);
        }
      };
      dataChannel.addEventListener('close', () => {
        this.pointerChannels.delete(dataChannel);
      })
    })
  }

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
