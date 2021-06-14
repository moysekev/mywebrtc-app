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
      //this.localVideoRef.nativeElement.autoplay = true;
      // Seems this has to be set by code to work :
      //this.localVideoRef.nativeElement.muted = true;
      // Attach stream
      //this.localVideoRef.nativeElement.srcObject = stream;

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

      conversation.onRemoteStreamPublished = (user: User, streamId: string, topic: any) => {
        console.log('onRemoteStreamPublished', user, streamId, topic);

        // TODO : decide to subscribe OR NOT to this streamId
        conversation.subscribe(user, streamId).then(mediaStream => {
          if (!this.streamsByUserAndId.has(user)) {
            this.streamsByUserAndId.set(user, new Map());
          }
          this.streamsByUserAndId.get(user)?.set(streamId, mediaStream);
          // TODO store mediaStream per user for display (instead of using conversation.channelsByPeerId attribute from html)
          // AND then we can hide Channel from the public API

        }).catch(error => {
          console.error('subscribe', error);
        });
      }

      conversation.onRemoteStreamUnpublished = (user: User, streamId: string, topic: any) => {
        console.log('onRemoteStreamUnpublished', user, streamId, topic);
        this.streamsByUserAndId.get(user)?.delete(streamId);
      }

      // Join the Conversation
      this.user = conversation.createParticipant();

      // Publish
      this.conversation.publish(this.user, mediaStream, 'webcam');

    }).catch((error: Error) => {
      console.log('getOrCreateConversation error', error);
    });
  }

  ngOnDestroy(): void {
    this.doCleanUp();
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
        this.conversation.publish(this.user, mediaStream);
      }
    }).catch((error: any) => {
      console.error("CAUGHT" + error);
    });
  }

}
