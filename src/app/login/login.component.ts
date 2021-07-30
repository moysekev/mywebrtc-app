import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import firebase from 'firebase';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  doFbSignIn(): Promise<firebase.User> {
    return new Promise<firebase.User>((resolve, reject) => {
      const provider = new firebase.auth.FacebookAuthProvider();
      firebase.auth().languageCode = 'fr';
      provider.setCustomParameters({
        'display': 'popup'
      });
      firebase
        .auth()
        .signInWithPopup(provider)
        .then((result) => {
          /** @type {firebase.auth.OAuthCredential} */
          const credential: firebase.auth.OAuthCredential | null = result.credential;
          // This gives you a Facebook Access Token. You can use it to access the Facebook API.
          //var accessToken = credential.accessToken;

          if (credential === null) {
            console.error('signInWithPopup', result);
            return;
          }
          console.log('signInWithPopup', result);

          // The signed-in user info.
          const user = result.user;
          if (user === null) {
            reject("signInWithPopup: user is null");
            return;
          }

          resolve(user);

          this.router.navigate(['/home']);
        })
        .catch((error) => {
          console.error("signInWithPopup", error);
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;

          reject(error);
        });
    });
  }
}
