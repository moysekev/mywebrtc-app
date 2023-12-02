import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import firebase from 'firebase/app';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthGuard } from './auth.guard';
import { ByeComponent } from './bye/bye.component';
import { HomeComponent } from './home/home.component';
import { LocalStreamComponent } from './local-stream/local-stream.component';
import { LoginComponent } from './login/login.component';
import { RemoteStreamComponent } from './remote-stream/remote-stream.component';
import { StreamVideoComponent } from './stream-video/stream-video.component';
import { WINDOW_PROVIDERS } from './windows-provider';

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

@NgModule({
  declarations: [
    AppComponent, StreamVideoComponent, HomeComponent, LoginComponent, ByeComponent, LocalStreamComponent, RemoteStreamComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule, ReactiveFormsModule,
    MatInputModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatGridListModule, MatCardModule
  ],
  providers: [WINDOW_PROVIDERS, AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {

    // 
    // const firebaseConfig = {
    //   apiKey: "AIzaSyDyZO8Khqsyei-rydS3suHXKGjsm2ZM5RA",
    //   authDomain: "apirtc-62375.firebaseapp.com",
    //   databaseURL: "https://apirtc-62375-default-rtdb.europe-west1.firebasedatabase.app",
    //   projectId: "apirtc-62375",
    //   storageBucket: "apirtc-62375.appspot.com",
    //   messagingSenderId: "218645311456",
    //   appId: "1:218645311456:web:920e5cf309f47b3d530585",
    //   measurementId: "G-01GRGSWHFE"
    // };

    // akigrafsoft's https://console.firebase.google.com/project/fir-rtc-59994/database/fir-rtc-59994-default-rtdb/data
    const firebaseConfig = {
      apiKey: "AIzaSyARhnphWgWlgnAdE12E_EhZieajbdDnRjU",
      authDomain: "fir-rtc-59994.firebaseapp.com",
      databaseURL: "https://fir-rtc-59994-default-rtdb.firebaseio.com",
      projectId: "fir-rtc-59994",
      storageBucket: "fir-rtc-59994.appspot.com",
      messagingSenderId: "973553602818",
      appId: "1:973553602818:web:eb5333163831adb600721b",
      measurementId: "G-GLQMLJ63S5"
    }

    console.log('initializeApp', firebaseConfig);
    const app = firebase.initializeApp(firebaseConfig);
    console.log('initializeApp returned', app);
  }
}
