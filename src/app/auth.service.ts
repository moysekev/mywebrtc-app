import { Injectable } from '@angular/core';
import { User, getAuth, onAuthStateChanged } from "@firebase/auth";
import { Observable, Subject } from 'rxjs';

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

    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${this.constructor.name}|constructor`)
    }
    const auth = getAuth();
    onAuthStateChanged(auth, user => {
      if (user) {
        // User is signed in.
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|onAuthStateChanged`, user)
        }
        this.user = user;
        this.userSubject.next(user);
      } else {
        // No user is signed in.
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|onAuthStateChanged : No user is signed in`)
        }
        this.user = null;
        this.userSubject.next(null);
      }
    });
  }
}
