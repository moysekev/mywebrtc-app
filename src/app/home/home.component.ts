import { Component, AfterViewInit, OnDestroy, HostListener, ViewChild, ElementRef, Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from "@angular/router";

import { AuthService } from '../auth.service';
import { WINDOW } from '../windows-provider';

//import firebase from 'firebase';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';

import { Conversation, ConversationOptions, LocalStream, RemoteStream, TrackInfo, User, LocalParticipant, RemoteParticipant, SubscribeOptions } from 'mywebrtc/dist';

interface UserData {
  nickname: string
  isModerator: boolean
}

interface Message {
  text: string
}

interface RemoteStreamData {
  topic: any
  mediaStream: MediaStream
  remoteAudioEnabled: boolean
  remoteVideoEnabled: boolean
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

  readonly remoteCandidates: Set<User> = new Set();
  readonly remoteParticipants: Set<RemoteParticipant> = new Set();

  messageFormGroup = this.fb.group({
    message: this.fb.control('', [Validators.required])
  });
  get messageFc(): FormControl {
    return this.messageFormGroup.get('message') as FormControl;
  }

  readonly year: number = new Date().getFullYear();

  localStream: LocalStream | undefined;
  localMediaStream: MediaStream | undefined;

  videoTrackCapabilities: MediaTrackCapabilities | undefined;
  videoTrackSettings: MediaTrackSettings | undefined;

  localDisplayMediaStream: MediaStream | undefined;

  localParticipant: LocalParticipant | undefined;
  localParticipantData: UserData | undefined;

  moderated: boolean = false;
  moderator: boolean = false;

  url: string | undefined;

  mediaStreamsByParticipantAndStream: Map<RemoteParticipant, Map<RemoteStream, RemoteStreamData>> = new Map();

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

    this.moderator = !this.authService.user?.isAnonymous;

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
      moderated: this.moderated
    }

    Conversation.getOrCreate(conversationId, firebase.database().ref('/').child("Conversations"), options).then((conversation: Conversation) => {
      console.log('conversation', conversation);
      this.conversation = conversation;

      // Listen to Conversation events
      //
      conversation.onModeratedChanged = (moderated: boolean) => {
        this.moderated = moderated;
      }
      conversation.onCandidateAdded = (candidate: User) => {
        console.log('onCandidateAdded', candidate);
        // Maintain local list of pending Candidates
        this.remoteCandidates.add(candidate);
      };
      conversation.onCandidateRemoved = (candidate: User) => {
        console.log('onCandidateRemoved', candidate);
        // Maintain local list of pending Candidates
        this.remoteCandidates.delete(candidate);
      };
      conversation.onParticipantAdded = (participant: RemoteParticipant) => {
        console.log('onParticipantAdded', participant);

        this.remoteParticipants.add(participant);

        participant.getUser().onUserDataUpdate = (userData: UserData) => {
          console.log('onUserDataUpdate', participant, userData);
        };
        participant.onStreamPublished = (stream: RemoteStream, topic: any) => {
          console.log('onStreamPublished', participant, stream, topic);
          // First, set listener(s)
          stream.onMediaStreamReady = (mediaStream: MediaStream) => {
            console.log('onMediaStreamReady', stream, mediaStream);
            this.doStoreMediaStreamByParticipantAndStream(participant, stream, topic, mediaStream);
            this.doListenToTracksEvents(mediaStream, "PEER:");
          }
          stream.onTracksStatusChanged = (tracksById: Map<string, TrackInfo>) => {
            console.log('onTracksStatusChanged', stream, tracksById);
            const remoteData = this.mediaStreamsByParticipantAndStream.get(participant)?.get(stream);
            tracksById.forEach((track) => {
              if (track.kind === 'audio') {
                if (remoteData) {
                  remoteData.remoteAudioEnabled = track.enabled;
                }
              }
              if (track.kind === 'video') {
                if (remoteData) {
                  remoteData.remoteVideoEnabled = track.enabled;
                }
              }
            });
          }
          // And then, subscribe
          this.localParticipant?.subscribe(stream);
          // or 
          //this.localParticipant?.subscribe(stream, { audio: true, video: false });
        };
        participant.onStreamUnpublished = (stream: RemoteStream) => {
          console.log('onStreamUnpublished', participant, stream);
          this.doRemoveMediaStream(participant, stream);
        };
      };
      conversation.onParticipantRemoved = (participant: RemoteParticipant | LocalParticipant) => {
        console.log('onParticipantRemoved', participant);
        if (participant instanceof RemoteParticipant) {
          this.doRemoveRemoteParticipant(participant);
        }
        else if (participant instanceof LocalParticipant) {
          console.log('localuser removed ?!', participant);
        }
      };

      conversation.onMessage = (participant: User, message: Message) => {
        this.messages.push([participant.userData as UserData, message]);
      }

      // Join the conversation
      const userData: UserData = {
        nickname: this.authService.user?.displayName || 'guest',
        isModerator: this.moderator
      };
      this.localParticipantData = userData;

      this.isWaitingForAcceptance = true;
      conversation.addParticipant(userData, { moderator: this.moderator }).then((participant) => {
        console.log('addParticipant succeed', participant);
        this.isWaitingForAcceptance = false;
        this.localParticipant = participant;
        this.localParticipant.getUser().onUserDataUpdate = (userData: UserData) => {
          console.log('onUserDataUpdate', this.localParticipant, userData);
          this.localParticipantData = userData;
        };
      }).catch(error => {
        console.log('addParticipant failed', error);
        this.isWaitingForAcceptance = false;
      });

      this.url = `${baseUrl}/${conversation.id}`;
    }).catch(error => {
      console.error("getOrcreate failed", error);
    });
  }

  ngAfterViewInit() {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then((mediaStream: MediaStream) => {
      console.log('ngAfterViewInit getUserMedia', mediaStream);
      this.doStoreAndBindLocalMediaStream(mediaStream);
    }).catch((error) => {
      console.error('ngAfterViewInit getUserMedia', error);
    });
  }

  doStoreAndBindLocalMediaStream(mediaStream: MediaStream) {
    this.localMediaStream = mediaStream;
    for (const track of mediaStream.getVideoTracks()) {
      if (typeof track.getCapabilities === 'function') {
        this.videoTrackCapabilities = track.getCapabilities();
        this.videoTrackSettings = track.getSettings();
      } else {
        console.log("getCapabilities not supported by browser")
      }
      break;
    }
    this.doListenToTracksEvents(mediaStream, "LOCAL:");
  }

  doListenToTracksEvents(mediaStream: MediaStream, logPrefix: string) {
    mediaStream.getTracks().forEach((track: MediaStreamTrack) => {
      track.onmute = (event) => {
        console.log(logPrefix + "onmute", mediaStream, track, event)
        if (this.localStream && (this.localStream.getMediaStream() === mediaStream)) {
          this.localStream.notifyTracksStatusChanged();
        }
      }
      track.onunmute = (event) => {
        console.log(logPrefix + "onunmute", mediaStream, track, event)
        if (this.localStream && (this.localStream.getMediaStream() === mediaStream)) {
          this.localStream.notifyTracksStatusChanged();
        }
      }
      track.onended = (event) => {
        console.log(logPrefix + "onended", mediaStream, track, event)
      }
    })
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

  toggleModeration() {
    this.conversation?.setModerated(!this.moderated);
  }

  accept(candidate: User) {
    this.conversation?.acceptCandidate(candidate);
  }

  reject(candidate: User) {
    this.conversation?.rejectCandidate(candidate);
  }

  eject(participant: RemoteParticipant) {
    this.conversation?.removeParticipant(participant);
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

  private doStoreMediaStreamByParticipantAndStream(participant: RemoteParticipant, stream: RemoteStream, topic: string, mediaStream: MediaStream) {
    if (!this.mediaStreamsByParticipantAndStream.has(participant)) {
      this.mediaStreamsByParticipantAndStream.set(participant, new Map());
    }
    this.mediaStreamsByParticipantAndStream.get(participant)?.set(stream,
      { topic: topic, mediaStream: mediaStream, remoteAudioEnabled: true, remoteVideoEnabled: true });
  }

  private doRemoveMediaStream(participant: RemoteParticipant, stream: RemoteStream) {
    const deleted = this.mediaStreamsByParticipantAndStream.get(participant)?.delete(stream);
    console.log('doRemoveMediaStream', participant, stream, deleted);
  }

  private doRemoveRemoteParticipant(participant: RemoteParticipant) {
    this.remoteParticipants.delete(participant);
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
        //const oldStream = this.localMediaStream;
        this.doStoreAndBindLocalMediaStream(mediaStream);
        if (this.localStream) {
          this.localStream.replaceMediaStream(mediaStream);
        }
      })
      .catch(error => {
        console.error("goHd", error);
      });
  }

  static doAppyAudioConstraint(mediaStream: MediaStream, constraintName: string, value: ConstrainULong | ConstrainDouble | ConstrainBoolean | ConstrainDOMString) {
    mediaStream.getAudioTracks().forEach(track => {
      const settings: MediaTrackSettings = track.getSettings();
      const constrainsts: any = settings;
      constrainsts[constraintName] = value;
      track.applyConstraints(constrainsts);
    });
  }

  goHDByApplyConstraints() {
    //MediaStreamTrack shoud have method :
    //Promise<undefined> applyConstraints(optional MediaTrackConstraints constraints = {});
    if (this.localMediaStream) {
      this.localMediaStream.getVideoTracks().forEach(track => {
        const constraints: MediaTrackConstraints = { width: { exact: 1280 }, height: { exact: 720 } }
        track.applyConstraints(constraints).then(() => {
          console.log("applyConstraints done", this.localMediaStream, constraints);
        }).catch(error => {
          console.error("applyConstraints error", error);
        });
      });
    }
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
