import { enableProdMode, importProvidersFrom } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

import { initializeApp } from "@firebase/app";

import { setLogLevel as setMyWebRtcLogLevel } from 'mywebrtc';

import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { AuthGuard } from './app/auth.guard';
import { WINDOW_PROVIDERS } from './app/windows-provider';
import { environment } from './environments/environment';
import { setLogLevel } from './logLevel';

setLogLevel('debug')
setMyWebRtcLogLevel('debug')

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
// };

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

console.log('main:firebase:initializeApp', firebaseConfig);
export const firebaseApp = initializeApp(firebaseConfig);

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatGridListModule, MatCardModule),
    WINDOW_PROVIDERS, AuthGuard,
    provideAnimations()
  ]
}).catch(err => console.error(err));
