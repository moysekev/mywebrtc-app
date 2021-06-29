import { Component, AfterViewInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';

import { Conversation, Stream, User, SubscribeOptions, initialize } from 'mywebrtc/dist';

interface UserData {
  nickname: string;
}

interface Message {
  text: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'mywebrtc-app';

  conversation: Conversation | undefined;

  // Messages (defined as an array of tuples)
  public readonly messages: Array<[UserData, Message]> = new Array();

  messageFormGroup = this.fb.group({
    message: this.fb.control('', [Validators.required])
  });
  get messageFc(): FormControl {
    return this.messageFormGroup.get('message') as FormControl;
  }

  localMediaStream: MediaStream | undefined;
  localDisplayMediaStream: MediaStream | undefined;

  user: User | undefined;

  mediaStreamsByUserAndStream: Map<User, Map<Stream, MediaStream>> = new Map();

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

  constructor(private fb: FormBuilder) {
    // const config = {
    //     apiKey: "AIzaSyDf599V3XGBNF8bPlWKHmYMdQhcDsFx9iQ",
    //     authDomain: "books-ce78f.firebaseapp.com",
    //     projectId: "books-ce78f",
    //     storageBucket: "books-ce78f.appspot.com",
    //     messagingSenderId: "377647622575",
    //     appId: "1:377647622575:web:8c2725e555b53edae2a75a",
    //     measurementId: "G-YEBD2NGZFE"
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
    initialize(firebaseConfig);
  }

  ngAfterViewInit() {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then((mediaStream: MediaStream) => {
      this.localMediaStream = mediaStream;
      console.log('ngAfterViewInit getUserMedia', mediaStream)

    }).catch((error) => {
      console.error("CAUGHT" + error);
    });
    this.dosetupConversation();
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

  dosetupConversation() {
    // Get or create Conversation
    //
    Conversation.getOrCreate('name').then((conversation: Conversation) => {
      console.log('conversation', conversation);
      this.conversation = conversation;

      // Listen to other users added to the Conversation
      //
      conversation.onRemoteUserAdded = (user: User) => {
        console.log('onRemoteUserAdded', user);
        user.onUserDataChange = (userData: UserData) => {
          console.log('onUserDataChange', user, userData);
        };
      };
      conversation.onRemoteUserRemoved = (user: User) => {
        console.log('onRemoteUserRemoved', user);
      };

      // Listen to streams remote users published
      //
      conversation.onRemoteStreamPublished = (user: User, stream: Stream) => {
        console.log('onRemoteStreamPublished', stream);

        // TODO : let user decide to subscribe OR NOT !
        //
        //conversation.subscribe(stream, { audioOnly: true });
        conversation.subscribe(stream);

        stream.onMediaStreamReady = (mediaStream: MediaStream) => {
          console.log('onMediaStreamReady', stream);
          this.doStoreStreamByUserAndStream(user, stream, mediaStream);
        }

      }
      conversation.onRemoteStreamUnpublished = (user: User, stream: Stream) => {
        console.log('onRemoteStreamUnpublished', stream);
        this.doRemoveMediaStream(user, stream);
      }

      conversation.onMessage = (user: User, message: Message) => {
        //
        this.messages.push([user.userData as UserData, message]);
      }

      // Join the Conversation
      const userData: UserData = { nickname: 'kevin' };
      this.user = conversation.createParticipant(userData);
    }).catch((error: Error) => {
      console.log('getOrCreateConversation error', error);
    });
  }

  sendMessage() {
    if (this.user && this.conversation)
      this.conversation.sendMessage(this.messageFc.value, this.user);
  }

  publish() {
    // Publish
    //this.conversation.publish(mediaStream, this.user);
    // Or
    if (this.conversation && this.localMediaStream && this.user) {
      this.conversation.publish(this.localMediaStream, this.user, 'webcam');
    }
    // Or
    //this.conversation.publish(mediaStream, this.user, { type: 'webcam', foo: 'bar' });
  }

  unpublish() {
    if (this.localMediaStream) {
      this.conversation?.unpublish(this.localMediaStream);
    }
  }

  unsubscribe(stream: Stream) {
    this.conversation?.unsubscribe(stream);
  }



  private doStoreStreamByUserAndStream(user: User, stream: Stream, mediaStream: MediaStream) {
    if (!this.mediaStreamsByUserAndStream.has(user)) {
      this.mediaStreamsByUserAndStream.set(user, new Map());
    }
    this.mediaStreamsByUserAndStream.get(user)?.set(stream, mediaStream);
  }
  private doRemoveMediaStream(user: User, stream: Stream) {
    const deleted = this.mediaStreamsByUserAndStream.get(user)?.delete(stream);
  }


  shareScreen() {
    // @ts-ignore (https://github.com/microsoft/TypeScript/issues/33232)
    navigator.mediaDevices.getDisplayMedia().then((mediaStream: MediaStream) => {
      this.localDisplayMediaStream = mediaStream;
      console.log('ngAfterViewInit getDisplayMedia', mediaStream)
      if (this.conversation && this.user) {
        this.conversation.publish(mediaStream, this.user, 'screen');
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
        if (this.conversation && oldStream) {
          this.conversation.replaceStream(oldStream, mediaStream);
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
