import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StreamVideoComponent } from './stream-video/stream-video.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';

import { HomeComponent } from './home/home.component';

import { AuthGuard } from './auth.guard';
import { WINDOW_PROVIDERS } from './windows-provider';

import firebase from 'firebase';
// import firebase from 'firebase/app';
// import 'firebase/database';
// import 'firebase/auth';

import { LoginComponent } from './login/login.component';
const firebaseOptions = {
  apiKey: "AIzaSyDyZO8Khqsyei-rydS3suHXKGjsm2ZM5RA",
  authDomain: "apirtc-62375.firebaseapp.com",
  databaseURL: "https://apirtc-62375-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "apirtc-62375",
  storageBucket: "apirtc-62375.appspot.com",
  messagingSenderId: "218645311456",
  appId: "1:218645311456:web:920e5cf309f47b3d530585",
  measurementId: "G-01GRGSWHFE"
};

console.log('initializeApp', firebaseOptions);
const app = firebase.initializeApp(firebaseOptions);
console.log('initializeApp returned', app);

import { initialize as initializeMyWebrtc } from 'mywebrtc/dist';
import { ByeComponent } from './bye/bye.component';
import { LocalStreamComponent } from './local-stream/local-stream.component';
import { RemoteStreamComponent } from './remote-stream/remote-stream.component';

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

  }
}
