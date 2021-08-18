import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, UrlSerializer } from '@angular/router';

import firebase from 'firebase';

import { USERS } from '../consts';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  returnUrl: string | undefined;

  constructor(private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'];
  }

  anonymousSignIn() {
    firebase.auth().signInAnonymously()
      .then((userCredential: firebase.auth.UserCredential) => {
        console.log(`Anonmymous user`, userCredential.user?.toJSON());
        //this.router.navigate(['/home']);
        this.router.navigateByUrl(this.returnUrl || '/home');
      })
      .catch((error) => {
        console.error(`firebase.signInAnonymously ${error.code}:${error.message}`)
      });
  }

  // firebase.auth().signInWithEmailAndPassword('kevin_moyse@yahoo.fr', 'elephant7')
  //   .then((userCredential) => {
  //     // Signed in
  //     var user = userCredential.user;
  //     console.log('Signed In', user);

  //     this.doSetupConversation();
  //     // ...
  //   })
  //   .catch((error) => {
  //     console.error(`firebase.signInWithEmailAndPassword ${error.code}:${error.message}`)
  //   });

  fbSignIn() {
    this.doFbSignIn().then((user: firebase.User) => {
      firebase.database().ref('/').child(USERS).child(user.uid).update(
        // Put at least uid: user.uid, because we are sure it is not empty
        user.toJSON()).then(() => {
          console.log(`User<${user.uid}> written in db`);
        });
      this.router.navigateByUrl(this.returnUrl || '/home');
    }
    ).catch((error) => {
      console.error('doFbSignIn', error)
    })
  }

  private doFbSignIn(): Promise<firebase.User> {
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
