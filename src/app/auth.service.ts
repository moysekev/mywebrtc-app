import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

// import firebase from 'firebase/app';
// import 'firebase/auth';
// import firebase from 'firebase/compat/app';
// import 'firebase/compat/auth';

import { User, getAuth, onAuthStateChanged } from "@firebase/auth";
// import { firebaseApp } from 'mywebrtc';
// import { firebaseApp } from './app.component';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user: User | null | undefined;

  private userSubject = new Subject<User | null>();
  user$: Observable<User | null> = this.userSubject.asObservable();

  constructor() {
    // firebase.auth().onAuthStateChanged((user) => {
    //   if (user) {
    //     // User is signed in.
    //     console.log('onAuthStateChanged', user);
    //     this.user = user;
    //     this.userSubject.next(user);
    //   } else {
    //     // No user is signed in.
    //     console.log('onAuthStateChanged : No user is signed in');
    //     this.user = null;
    //     this.userSubject.next(null);
    //   }
    // });

    console.log('AuthService:firebaseApp',)
    const auth = getAuth();
    onAuthStateChanged(auth, user => {
      if (user) {
        // User is signed in.
        console.log('onAuthStateChanged', user);
        this.user = user;
        this.userSubject.next(user);
      } else {
        // No user is signed in.
        console.log('onAuthStateChanged : No user is signed in');
        this.user = null;
        this.userSubject.next(null);
      }
    });
    console.log('AuthService:done')
  }
}
