import { Component, AfterViewInit, OnDestroy, HostListener } from '@angular/core';

import { Conversation, Topic, User, initialize } from 'mywebrtc/dist';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'mywebrtc-app';

  conversation: Conversation | undefined;

  localMediaStream: MediaStream | undefined;
  localDisplayMediaStream: MediaStream | undefined;

  user: User | undefined;

  streamsByUserAndId: Map<User, Map<string, MediaStream>> = new Map();

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

  constructor() {
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
      this.doGetConversationAndPublish(mediaStream);
    }).catch((error) => {
      console.error("CAUGHT" + error);
    });
  }

  doGetConversationAndPublish(mediaStream: MediaStream) {

    // Get or create Conversation
    //
    Conversation.getOrCreate('name').then((conversation: Conversation) => {
      console.log('conversation', conversation);
      this.conversation = conversation;

      // Listen to other users added to the Conversation
      //
      conversation.onRemoteUserAdded = (user: User) => {
        console.log('onRemoteUserAdded', user);
      };
      conversation.onRemoteUserRemoved = (user: User) => {
        console.log('onRemoteUserRemoved', user);
      };

      // Listen to streams remote users published
      //
      conversation.onRemoteStreamPublished = (topic: Topic) => {
        console.log('onRemoteStreamPublished', topic);

        // TODO : decide to subscribe OR NOT to this streamId
        conversation.subscribe(topic).then(mediaStream => {
          this.doStoreStreamByUserAndId(topic.user, topic.streamId, mediaStream);
        }).catch(error => {
          console.error('subscribe', error);
        });
      }
      conversation.onRemoteStreamUnpublished = (topic: Topic) => {
        console.log('onRemoteStreamUnpublished', topic);
        this.streamsByUserAndId.get(topic.user)?.delete(topic.streamId);
      }

      // conversation.onStreamReady = (user: User, topic: any) => {
      //   this.doStoreStream(user, streamId, mediaStream);
      // }

      // Join the Conversation
      this.user = conversation.createParticipant();

      // Publish
      this.conversation.publish(mediaStream, { user: this.user, metadata: 'webcam' });

    }).catch((error: Error) => {
      console.log('getOrCreateConversation error', error);
    });
  }

  ngOnDestroy(): void {
    this.doCleanUp();
  }

  // TODO store by topic ? there can be a list of streams under same topic
  private doStoreStreamByUserAndId(user: User, streamId: string, mediaStream: MediaStream) {
    if (!this.streamsByUserAndId.has(user)) {
      this.streamsByUserAndId.set(user, new Map());
    }
    this.streamsByUserAndId.get(user)?.set(streamId, mediaStream);
  }

  private doCleanUp() {
    if (this.conversation) {
      this.conversation.close();
    }
  }

  shareScreen() {
    // @ts-ignore (https://github.com/microsoft/TypeScript/issues/33232)
    navigator.mediaDevices.getDisplayMedia().then((mediaStream: MediaStream) => {
      this.localDisplayMediaStream = mediaStream;
      console.log('ngAfterViewInit getDisplayMedia', mediaStream)
      if (this.conversation && this.user) {
        this.conversation.publish(mediaStream, { user: this.user, metadata: 'screen' });
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

}
