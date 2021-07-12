import { Component, AfterViewInit, OnDestroy, HostListener, ViewChild, ElementRef, Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";

import { WINDOW } from '../windows-provider';

import firebase from 'firebase';

import { Conversation, LocalStream, RemoteStream, Participant, LocalParticipant, RemoteParticipant, SubscribeOptions } from 'mywebrtc/dist';

interface UserData {
  nickname: string;
}

interface Message {
  text: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  //title = 'mywebrtc-app';

  conversation: Conversation | undefined;

  // Messages (defined as an array of tuples)
  public readonly messages: Array<[UserData, Message]> = new Array();

  remoteParticipants: Set<RemoteParticipant> = new Set();

  messageFormGroup = this.fb.group({
    message: this.fb.control('', [Validators.required])
  });
  get messageFc(): FormControl {
    return this.messageFormGroup.get('message') as FormControl;
  }

  localStream: LocalStream | undefined;
  localMediaStream: MediaStream | undefined;
  localDisplayMediaStream: MediaStream | undefined;

  localParticipant: LocalParticipant | undefined;

  url: string | undefined;

  mediaStreamsByParticipantAndStream: Map<RemoteParticipant, Map<RemoteStream, MediaStream>> = new Map();

  @ViewChild("dwnld") aRef: ElementRef | undefined;

  // Note : beforeUnloadHandler alone does not work on android Chrome
  // seems it requires unloadHandler to do the same to work evrywhere...
  // https://stackoverflow.com/questions/35779372/window-onbeforeunload-doesnt-trigger-on-android-chrome-alt-solution
  //
  @HostListener('window:unload', ['$event'])
  unloadHandler(event: any) {
    console.log("unloadHandler", event);
    this.doCleanUp();
  }

  // Use BEFORE unload to hangup (works for Firefox at least)
  // This is usefull if user closes the tab, or refreshes the page
  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: any) {
    console.log("beforeUnloadHandler", event);
    this.doCleanUp();
  }

  constructor(@Inject(WINDOW) public window: Window,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder) {

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

    firebase.initializeApp(firebaseOptions);
  }

  ngOnInit(): void {
    // Get conversation name and base url from current path (pattern : "/path/to/<conversationid>")
    //
    const conversationId = this.activatedRoute.snapshot.paramMap.get("id");

    var baseUrl: string;
    if (conversationId) {
      const path = `${this.window.location.pathname}`.split('/');
      // remove last element which is the conversationName
      path.pop();
      // and recreate base url
      baseUrl = `${this.window.location.origin}` + path.join('/');
    } else {
      baseUrl = `${this.window.location.href}`;
    }

    console.log('conversationId', conversationId);

    this.doFbSignIn().then((user: firebase.User) => {
      this.doSetupConversation(conversationId).then((conversation) => {
        // Join the Conversation
        const userData: UserData = { nickname: 'kevin' };
        this.localParticipant = conversation.addParticipant(userData);

        this.url = `${baseUrl}/${conversation.id}`;
      });
    });
    // firebase.auth().signInAnonymously()
    //   .then(() => {
    //     this.doSetupConversation();
    //   })
    //   .catch((error) => {
    //     console.error(`firebase.signInAnonymously ${error.code}:${error.message}`)
    //   });

    // Or

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

          if (credential === null) {
            console.error('signInWithPopup', result);
            return;
          }

          // The signed-in user info.
          const user = result.user;

          // This gives you a Facebook Access Token. You can use it to access the Facebook API.
          var accessToken = credential.accessToken;

          // ...
          console.log('signInWithPopup', result);

          if (user === null) {
            reject("user is null");
            return;
          }
          resolve(user);
        })
        .catch((error) => {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;

          // ...
          console.error("signInWithPopup", error);
          reject(error);
        });
    });
  }

  ngAfterViewInit() {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then((mediaStream: MediaStream) => {
      this.localMediaStream = mediaStream;
      console.log('ngAfterViewInit getUserMedia', mediaStream);
    }).catch((error) => {
      console.error("CAUGHT" + error);
    });
  }

  ngOnDestroy(): void {
    this.doCleanUp();
  }

  // --------------------------------------------------------------------------

  private doCleanUp() {
    if (this.conversation) {
      this.conversation.close()
        .then(() => { console.log('Conversation closed') })
        .catch(error => { console.log('Conversation closing error', error) });
    }
  }

  doSetupConversation(id: string | undefined | null): Promise<Conversation> {

    return new Promise<Conversation>((resolve, reject) => {
      // Get or create Conversation
      //
      Conversation.create(id).then((conversation: Conversation) => {
        console.log('conversation', conversation);
        this.conversation = conversation;

        // Listen to other users added to the Conversation
        //
        conversation.onRemoteParticipantAdded = (participant: RemoteParticipant) => {
          console.log('onRemoteParticipantAdded', participant);
          this.remoteParticipants.add(participant);

          participant.onUserDataUpdate = (userData: UserData) => {
            console.log('onUserDataUpdate', participant, userData);
          };
          participant.onStreamPublished = (stream: RemoteStream) => {
            console.log('onStreamPublished', participant, stream);

            // TODO : let user decide to subscribe OR NOT !
            //
            //stream.subscribe(stream, { audioOnly: true });
            stream.subscribe();

            stream.onMediaStreamReady = (mediaStream: MediaStream) => {
              console.log('onMediaStreamReady', stream);
              this.doStoreMediaStreamByParticipantAndStream(participant, stream, mediaStream);
            }
          };
          participant.onStreamUnpublished = (stream: RemoteStream) => {
            console.log('onStreamUnpublished', stream);
            this.doRemoveMediaStream(participant, stream);
          };
        };
        conversation.onRemoteParticipantRemoved = (participant: RemoteParticipant) => {
          console.log('onRemoteParticipantRemoved', participant);
          this.remoteParticipants.delete(participant);
        };

        // Listen to streams remote users published
        //
        // conversation.onRemoteStreamPublished = (user: User, stream: Stream) => {
        //   console.log('onRemoteStreamPublished', stream);

        //   // TODO : let user decide to subscribe OR NOT !
        //   //
        //   //stream.subscribe(stream, { audioOnly: true });
        //   stream.subscribe();

        //   stream.onMediaStreamReady = (mediaStream: MediaStream) => {
        //     console.log('onMediaStreamReady', stream);
        //     this.doStoreMediaStreamByUserAndStream(user, stream, mediaStream);
        //   }
        // }
        // conversation.onRemoteStreamUnpublished = (user: User, stream: Stream) => {
        //   console.log('onRemoteStreamUnpublished', stream);
        //   this.doRemoveMediaStream(user, stream);
        // }

        conversation.onMessage = (participant: Participant, message: Message) => {
          //
          this.messages.push([participant.userData as UserData, message]);
        }

        resolve(conversation);

      }).catch((error: Error) => {
        console.log('getOrCreateConversation error', error);
        reject(error);
      });
    });
  }

  sendMessage() {
    // if (this.user && this.conversation)
    //   this.conversation.sendMessage(this.messageFc.value, this.user);
    if (this.localParticipant) {
      this.localParticipant.sendMessage(this.messageFc.value);
    }
  }

  publish() {
    // Publish
    //this.conversation.publish(this.localMediaStream, this.user);
    // Or
    // if (this.conversation && this.localMediaStream && this.user) {
    //   this.conversation.publish(this.localMediaStream, this.user, 'webcam');
    // }
    // Or
    //this.conversation.publish(this.localMediaStream, this.user, { type: 'webcam', foo: 'bar' });

    if (this.localMediaStream && this.localParticipant) {
      this.localStream = this.localParticipant.publish(this.localMediaStream, 'webcam');
      // Or
      //this.user.publish(this.localMediaStream, { type: 'webcam', foo: 'bar' });
    }
  }

  unpublish() {
    // if (this.localMediaStream) {
    //   this.conversation?.unpublish(this.localMediaStream);
    // }
    if (this.localMediaStream) {
      this.localParticipant?.unpublish(this.localMediaStream);
    }
  }

  unsubscribe(stream: RemoteStream) {
    //this.conversation?.unsubscribe(stream);
    stream.unsubscribe();
  }

  private doStoreMediaStreamByParticipantAndStream(participant: RemoteParticipant, stream: RemoteStream, mediaStream: MediaStream) {
    if (!this.mediaStreamsByParticipantAndStream.has(participant)) {
      this.mediaStreamsByParticipantAndStream.set(participant, new Map());
    }
    this.mediaStreamsByParticipantAndStream.get(participant)?.set(stream, mediaStream);
  }

  private doRemoveMediaStream(participant: RemoteParticipant, stream: RemoteStream) {
    const deleted = this.mediaStreamsByParticipantAndStream.get(participant)?.delete(stream);
  }

  shareScreen() {
    // @ts-ignore (https://github.com/microsoft/TypeScript/issues/33232)
    navigator.mediaDevices.getDisplayMedia().then((mediaStream: MediaStream) => {
      this.localDisplayMediaStream = mediaStream;
      console.log('ngAfterViewInit getDisplayMedia', mediaStream)
      if (this.localParticipant) {
        this.localParticipant.publish(mediaStream, 'screen');
      }
    }).catch((error: any) => {
      console.error("shareScreen", error);
    });
  }

  goHd() {
    if (this.localMediaStream) {
      this.localMediaStream.getTracks().forEach(track => {
        track.stop();
      });
    }

    navigator.mediaDevices.getUserMedia({
      video: { width: { exact: 1280 }, height: { exact: 720 } }
    })
      .then(mediaStream => {
        const oldStream = this.localMediaStream;
        this.localMediaStream = mediaStream;
        if (this.localStream && oldStream) {
          this.localStream.replaceMediaStream(oldStream, mediaStream);
        }
      })
      .catch(error => {
        console.error("goHd", error);
      });
  }

  mediaRecorder: MediaRecorder | undefined;
  recordedBlobs: Array<Blob> = new Array();

  record(mediaStream: MediaStream) {
    this.mediaRecorder = new MediaRecorder(mediaStream);
    this.mediaRecorder.onstop = (event: any) => {
      console.log('Recorder stopped: ', event);
    };
    this.mediaRecorder.ondataavailable = (event: any) => {
      console.log('ondataavailable', event);
      if (event.data && event.data.size > 0) {
        this.recordedBlobs.push(event.data);
      }
    };
    this.mediaRecorder.start();
  }
  stopRecording() {
    this.mediaRecorder?.stop();
    setTimeout(() => {
      const blob = new Blob(this.recordedBlobs, { type: 'video/webm' });
      const url = window.URL.createObjectURL(blob);
      if (this.aRef) {
        const native = this.aRef.nativeElement;
        native.href = url;
        native.download = "video.webm";
      }
      this.aRef?.nativeElement.click();
      window.URL.revokeObjectURL(url);

      this.mediaRecorder = undefined;
    }, 1000);
  }

}
