import { KeyValuePipe, NgFor } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostBinding, Input, OnDestroy, ViewChild } from '@angular/core';
import { Stream } from 'mywebrtc/dist/Stream';
import { PointerComponent } from '../pointer/pointer.component';
import { StreamVideoComponent } from '../stream-video/stream-video.component';
import { ContextService } from '../context.service';

@Component({
  selector: 'app-controlled-stream',
  standalone: true,
  imports: [NgFor, KeyValuePipe, StreamVideoComponent, PointerComponent],
  templateUrl: './controlled-stream.component.html',
  styleUrl: './controlled-stream.component.css'
})
export class ControlledStreamComponent implements AfterViewInit, OnDestroy {

  // store pointers dataChannels with corresponding nickname
  inBoundDataChannels: Set<RTCDataChannel> = new Set();
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

      this.inBoundDataChannels.add(dataChannel);

      dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.nickname !== undefined) {
          if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${this.constructor.name}|dataChannel.onmessage received nickname`, data.nickname)
          }
          this.pointerChannels.set(dataChannel, data.nickname);
        } else {
          console.warn(`${this.constructor.name}|dataChannel.onmessage received`, data)
        }
      };
      dataChannel.addEventListener('error', (error) => {
        console.error(`${this.constructor.name}|dataChannel.onerror`, error)
        this.inBoundDataChannels.delete(dataChannel);
        this.pointerChannels.delete(dataChannel);
      })
      dataChannel.addEventListener('close', () => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|dataChannel.onclose`)
        }
        this.inBoundDataChannels.delete(dataChannel);
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

  constructor(private el: ElementRef,
    private contextService: ContextService
  ) { }

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

  outboundDataChannels: Set<RTCDataChannel> = new Set();
  openDataChannels: Set<RTCDataChannel> = new Set();

  onPointerEnter(event: PointerEvent) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${this.constructor.name}|onPointerEnter`, event)
    }

    this._stream?.broadcast((dataChannel) => {
      const added = this.outboundDataChannels.add(dataChannel);
      if (globalThis.logLevel.isDebugEnabled) {
        console.debug(`${this.constructor.name}|onPointerEnter stored outbound DataChannel`, dataChannel, this.outboundDataChannels.size, added)
      }

      dataChannel.onopen = () => {
        // send first message indicating the pointer location that will be sent next
        // comes from the current user
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|broadcast dataChannel.onopen, sending nickname`, dataChannel.label, this.contextService.nickname)
        }
        dataChannel.send(JSON.stringify({ nickname: this.contextService.nickname }))
        this.openDataChannels.add(dataChannel);
      };
      dataChannel.onclose = () => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|broadcast dataChannel.onclose`)
        }
        this.outboundDataChannels.delete(dataChannel)
        this.openDataChannels.delete(dataChannel)
      }
      dataChannel.onerror = (error) => {
        if (globalThis.logLevel.isWarnEnabled) {
          console.warn(`${this.constructor.name}|broadcast dataChannel.onerror`, error)
        }
        this.outboundDataChannels.delete(dataChannel)
        this.openDataChannels.delete(dataChannel)
      }
    }, { ordered: false })
  }

  onPointerMove(event: PointerEvent) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events

    // if (this.dataChannel) {
    this.openDataChannels.forEach((dataChannel) => {
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
      // console.log('SENDING', { left, top })
      dataChannel.send(JSON.stringify({ left, top }))
    })

  }

  onPointerLeave(event: PointerEvent) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
    if (globalThis.logLevel.isDebugEnabled) {
      console.log('onPointerLeave', event)
    }
    this.openDataChannels.forEach((dataChannel) => {
      dataChannel.close()
    })
    this.openDataChannels.clear()
    this.outboundDataChannels.clear()
  }

}
