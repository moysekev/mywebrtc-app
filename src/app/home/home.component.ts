import { Component, AfterViewInit, OnDestroy, HostListener, ViewChild, ElementRef, Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from "@angular/router";

import { AuthService } from '../auth.service';
import { WINDOW } from '../windows-provider';

import firebase from 'firebase';

import { Conversation, ConversationOptions, LocalStream, RemoteStream, User, LocalUser, RemoteUser, SubscribeOptions } from 'mywebrtc/dist';

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

  conversation: Conversation | undefined;

  // Messages (defined as an array of tuples)
  public readonly messages: Array<[UserData, Message]> = new Array();

  readonly remoteCandidates: Set<RemoteUser> = new Set();

  messageFormGroup = this.fb.group({
    message: this.fb.control('', [Validators.required])
  });
  get messageFc(): FormControl {
    return this.messageFormGroup.get('message') as FormControl;
  }

  localStream: LocalStream | undefined;
  localMediaStream: MediaStream | undefined;
  localDisplayMediaStream: MediaStream | undefined;

  localParticipant: LocalUser | undefined;
  localParticipantData: UserData | undefined;

  url: string | undefined;

  mediaStreamsByParticipantAndStream: Map<RemoteUser, Map<RemoteStream, [string, MediaStream]>> = new Map();

  isWaitingForAcceptance = false;

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
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
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

    const options: ConversationOptions = {
      moderation: this.moderation
    }

    Conversation.getOrCreate(conversationId, options).then((conversation: Conversation) => {
      console.log('conversation', conversation);
      this.conversation = conversation;


      // Listen to Conversation events
      //
      conversation.onModerationChanged = (moderation: boolean) => {
        this.moderation = moderation;
      }
      conversation.onRemoteCandidateAdded = (candidate: RemoteUser) => {
        console.log('onRemoteCandidateAdded', candidate);
        // Maintain local list of pending Candidates
        this.remoteCandidates.add(candidate);
      };
      conversation.onRemoteCandidateRemoved = (candidate: RemoteUser) => {
        console.log('onRemoteCandidateRemoved', candidate);
        // Maintain local list of pending Candidates
        this.remoteCandidates.delete(candidate);
      };
      conversation.onRemoteParticipantAdded = (participant: RemoteUser) => {
        console.log('onRemoteParticipantAdded', participant);

        participant.onUserDataUpdate = (userData: UserData) => {
          console.log('onUserDataUpdate', participant, userData);
        };
        participant.onStreamPublished = (stream: RemoteStream, topic: any) => {
          console.log('onStreamPublished', participant, stream, topic);
          // First set listener(s) to onMediaStreamReady
          stream.onMediaStreamReady = (mediaStream: MediaStream) => {
            console.log('onMediaStreamReady', stream);
            this.doStoreMediaStreamByParticipantAndStream(participant, stream, topic, mediaStream);
          }
          // And then, subscribe
          stream.subscribe();
          // or 
          //stream.subscribe({ audio: true, video: false });
        };
        participant.onStreamUnpublished = (stream: RemoteStream) => {
          console.log('onStreamUnpublished', participant, stream);
          this.doRemoveMediaStream(participant, stream);
        };
      };
      conversation.onRemoteParticipantRemoved = (participant: RemoteUser) => {
        console.log('onRemoteParticipantRemoved', participant);
        this.doRemoveRemoteParticipant(participant);
      };

      conversation.onMessage = (participant: User, message: Message) => {
        this.messages.push([participant.userData as UserData, message]);
      }

      // Join the conversation

      const userData: UserData = { nickname: this.authService.user?.displayName || 'guest' };
      this.localParticipantData = userData;

      const moderator: boolean = !this.authService.user?.isAnonymous;

      this.isWaitingForAcceptance = true;
      conversation.addParticipant(userData, moderator).then((participant) => {
        this.isWaitingForAcceptance = false;
        this.localParticipant = participant;
        this.localParticipant.onUserDataUpdate = (userData: UserData) => {
          console.log('onUserDataUpdate', this.localParticipant, userData);
          this.localParticipantData = userData;
        };
      }).catch(error => {
        this.isWaitingForAcceptance = false;
        console.error('addParticipant', error)
      });

      this.url = `${baseUrl}/${conversation.id}`;
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

  public signOut() {
    if (this.conversation) {
      this.conversation.close()
        .then(() => {
          this.conversation = undefined;
          console.log('Conversation closed');
          this.doSignOut();
        })
        .catch((error: any) => { this.doSignOut(); });
    } else {
      this.doSignOut();
    }

  }
  private doSignOut() {
    firebase.auth().signOut().then(() => {
      console.log('signed Out');
      this.router.navigate(['/login']);
    }).catch(error => { console.error('doSignOut', error) });
  }

  // --------------------------------------------------------------------------

  private doCleanUp() {
    if (this.conversation) {
      this.conversation.close()
        .then(() => {
          this.conversation = undefined;
          console.log('Conversation closed');
        })
        .catch((error: any) => { console.log('Conversation closing error', error) });
    }
  }


  moderation: boolean = false;

  toggleModeration() {
    this.conversation?.setModeration(!this.moderation);
  }

  accept(candidate: RemoteUser) {
    this.conversation?.acceptCandidate(candidate);
  }

  sendMessage() {
    if (this.localParticipant) {
      this.localParticipant.sendMessage(this.messageFc.value);
    } else {
      console.error('Cannot sendMessage', this.localParticipant);
    }
  }

  // TODO : implement a sendPrivateMessage in the library ?

  publish() {
    if (this.localMediaStream && this.localParticipant) {
      this.localStream = this.localParticipant.publish(this.localMediaStream, 'webcam');
      // Or
      //this.localParticipant.publish(this.localMediaStream, { type: 'webcam', foo: 'bar' });
    } else {
      console.error('Cannot publish', this.localMediaStream, this.localParticipant);
    }
  }

  unpublish() {
    if (this.localMediaStream) {
      this.localParticipant?.unpublish(this.localMediaStream);
      this.localStream = undefined;
    }
  }

  private doStoreMediaStreamByParticipantAndStream(participant: RemoteUser, stream: RemoteStream, topic: string, mediaStream: MediaStream) {
    if (!this.mediaStreamsByParticipantAndStream.has(participant)) {
      this.mediaStreamsByParticipantAndStream.set(participant, new Map());
    }
    this.mediaStreamsByParticipantAndStream.get(participant)?.set(stream, [topic, mediaStream]);
  }

  private doRemoveMediaStream(participant: RemoteUser, stream: RemoteStream) {
    const deleted = this.mediaStreamsByParticipantAndStream.get(participant)?.delete(stream);
    console.log('doRemoveMediaStream', participant, stream, deleted);
  }

  private doRemoveRemoteParticipant(participant: RemoteUser) {
    const deleted = this.mediaStreamsByParticipantAndStream.delete(participant);
    console.log('doRemoveRemoteParticipant', participant, deleted, this.mediaStreamsByParticipantAndStream.size);
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
