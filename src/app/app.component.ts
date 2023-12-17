import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { initialize as initializeMyWebrtc } from 'mywebrtc';

initializeMyWebrtc({
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ],
    },
  ],
  iceCandidatePoolSize: 10,
})

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterOutlet]
})
export class AppComponent {
  title = 'mywebrtc-app';
  constructor() { }
}