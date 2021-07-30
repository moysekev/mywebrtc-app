import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, Subject } from 'rxjs';

import firebase from 'firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user: firebase.User | null | undefined;

  private userSubject = new Subject<firebase.User | null>();
  user$: Observable<firebase.User | null> = this.userSubject.asObservable();

  constructor(private router: Router) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        console.log('onAuthStateChanged', user);
        this.user = user;
        this.userSubject.next(user);

        //this.router.navigate(['/home']);
      } else {
        // No user is signed in.
        console.log('No user is signed in');
        this.user = null;
        this.userSubject.next(null);
        this.router.navigate(['/login']);
      }
    });
  }
}
