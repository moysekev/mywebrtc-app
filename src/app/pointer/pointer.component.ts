import { Component, ElementRef, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pointer',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './pointer.component.html',
  styleUrl: './pointer.component.css'
})
export class PointerComponent {

  @Input({ required: true }) nickname: string = "";

  _dataChannel: RTCDataChannel | undefined;
  @Input({ required: true }) set dataChannel(dataChannel: RTCDataChannel) {
    this._dataChannel = dataChannel;
    dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(`${this.constructor.name}|onmessage`, data)
      this.el.nativeElement.style.left = `${data.left}%`;
      this.el.nativeElement.style.top = `${data.top}%`
    };
  }

  constructor(private el: ElementRef) { }
}
