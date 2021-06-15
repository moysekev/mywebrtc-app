import { Component, AfterViewInit, OnDestroy, HostListener } from '@angular/core';

import { Credentials, Conversation, User } from 'mywebrtc/dist';


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
    Conversation.getOrCreate('name', Credentials.buildWithPassword('username', 'password')).then((conversation: Conversation) => {
      console.log('conversation', conversation);
      this.conversation = conversation;
      conversation.onRemoteUserAdded = (user: User) => {
        console.log('onRemoteUserAdded', user);
      };
      conversation.onRemoteUserRemoved = (user: User) => {
        console.log('onRemoteUserRemoved', user);
        //this.channelsByPeer.delete(peer);
      };

      conversation.onRemoteStreamPublished = (topic: { user: User, metadata: any }, streamId: string) => {
        console.log('onRemoteStreamPublished', topic, streamId);

        // TODO : decide to subscribe OR NOT to this streamId
        conversation.subscribe(topic, streamId).then(mediaStream => {
          this.doStoreStream(topic.user, streamId, mediaStream);
        }).catch(error => {
          console.error('subscribe', error);
        });
      }

      conversation.onRemoteStreamUnpublished = (topic: { user: User, metadata: any }, streamId: string) => {
        console.log('onRemoteStreamUnpublished', topic, streamId);
        this.streamsByUserAndId.get(topic.user)?.delete(streamId);
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
  private doStoreStream(user: User, streamId: string, mediaStream: MediaStream) {
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
      console.error("CAUGHT" + error);
    });
  }

}
