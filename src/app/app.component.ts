import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import firebase from 'firebase/app';

import { initialize as initializeMyWebrtc } from 'mywebrtc/dist';

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
  constructor() {
    // 
    const firebaseConfig = {
      apiKey: "AIzaSyDyZO8Khqsyei-rydS3suHXKGjsm2ZM5RA",
      authDomain: "apirtc-62375.firebaseapp.com",
      databaseURL: "https://apirtc-62375-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "apirtc-62375",
      storageBucket: "apirtc-62375.appspot.com",
      messagingSenderId: "218645311456",
      appId: "1:218645311456:web:920e5cf309f47b3d530585",
      measurementId: "G-01GRGSWHFE"
    };

    // akigrafsoft's https://console.firebase.google.com/project/fir-rtc-59994/database/fir-rtc-59994-default-rtdb/data
    // const firebaseConfig = {
    //   apiKey: "AIzaSyARhnphWgWlgnAdE12E_EhZieajbdDnRjU",
    //   authDomain: "fir-rtc-59994.firebaseapp.com",
    //   databaseURL: "https://fir-rtc-59994-default-rtdb.firebaseio.com",
    //   projectId: "fir-rtc-59994",
    //   storageBucket: "fir-rtc-59994.appspot.com",
    //   messagingSenderId: "973553602818",
    //   appId: "1:973553602818:web:eb5333163831adb600721b",
    //   measurementId: "G-GLQMLJ63S5"
    // }

    console.log('initializeApp', firebaseConfig);
    const app = firebase.initializeApp(firebaseConfig);
    console.log('initializeApp returned', app);
  }
}