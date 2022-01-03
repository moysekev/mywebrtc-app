import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

//import firebase from 'firebase';
import firebase from 'firebase/app';
//import 'firebase/database';
import 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user: firebase.User | null | undefined;

  private userSubject = new Subject<firebase.User | null>();
  user$: Observable<firebase.User | null> = this.userSubject.asObservable();

  constructor() {
    firebase.auth().onAuthStateChanged((user) => {
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
  }
}
