import { ClipboardModule } from '@angular/cdk/clipboard';
import { KeyValuePipe, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from "@angular/router";


import { getDatabase, ref } from "@firebase/database";


import { Conversation, ConversationOptions, LocalParticipant, LocalStream, RemoteParticipant, RemoteStream, User } from 'mywebrtc';

import { saveAs } from 'file-saver';

import { MediaStreamHelper } from '../MediaStreamHelper';
import { AuthService } from '../auth.service';
import { ContextService } from '../context.service';
import { LocalStreamComponent } from '../local-stream/local-stream.component';
import { RemoteStreamComponent } from '../remote-stream/remote-stream.component';
import { WINDOW } from '../windows-provider';

interface UserData {
  nickname: string
  isModerator: boolean
}

interface Message {
  text: string
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [NgIf, NgFor,
    ClipboardModule,
    LocalStreamComponent, RemoteStreamComponent,
    MatButtonModule, MatIconModule,
    FormsModule, MatFormFieldModule, MatInputModule,
    KeyValuePipe]
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
  get messageFc(): UntypedFormControl {
    return this.messageFormGroup.get('message') as UntypedFormControl;
  }

  get nickname() {
    return this.localParticipant?.user.getUserData().nickname;
  }
  set nickname(value: string) {
    console.log('set nickname', value)
    // this._nickname = value;
    this.localParticipant?.user.setUserData({ ...this.localParticipant?.user.getUserData(), nickname: value })
    this.contextService.setNickname(value)
  }

  // readonly year: number = new Date().getFullYear();

  localParticipant: LocalParticipant | undefined;
  localParticipantData: UserData | undefined;

  localStream: LocalStream | undefined;
  localMediaStream: MediaStream | undefined;

  audioTrackCapabilities: MediaTrackCapabilities | undefined;
  audioTrackConstraints: MediaTrackConstraints | undefined;
  audioTrackSettings: MediaTrackSettings | undefined;
  videoTrackCapabilities: MediaTrackCapabilities | undefined;
  videoTrackConstraints: MediaTrackConstraints | undefined;
  videoTrackSettings: MediaTrackSettings | undefined;

  localDisplayMediaStream: MediaStream | undefined;

  moderated: boolean = false;
  moderator: boolean = false;

  url: string | undefined;

  remoteStreamsByParticipant: Map<RemoteParticipant, Set<RemoteStream>> = new Map();

  isWaitingForAcceptance = false;

  // snapshotSrc?: string;

  @ViewChild("dwnld") aRef: ElementRef | undefined;

  // Note : beforeUnloadHandler alone does not work on android Chrome
  // seems it requires unloadHandler to do the same to work everywhere...
  // https://stackoverflow.com/questions/35779372/window-onbeforeunload-doesnt-trigger-on-android-chrome-alt-solution
  //
  @HostListener('window:unload', ['$event'])
  unloadHandler(event: any) {
    // console.log("unloadHandler", event);
    event.preventDefault();
    this.doCleanUp();
  }

  // Use BEFORE unload to hangup (works for Firefox at least)
  // This is useful if user closes the tab, or refreshes the page
  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: BeforeUnloadEvent) {
    event.preventDefault();
    this.doCleanUp();
    event.returnValue = true;
  }

  constructor(@Inject(WINDOW) public window: Window,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private contextService: ContextService,
    private fb: UntypedFormBuilder,
  ) { }

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

    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${this.constructor.name}|ngOnInit baseUrl conversationId`, baseUrl, conversationId);
    }

    const options: ConversationOptions = {
      moderated: this.moderated
    }

    // ref(getDatabase(), 'Conversations')
    Conversation.getOrCreate(conversationId, ref(getDatabase()), options).then((conversation: Conversation) => {
      if (globalThis.logLevel.isInfoEnabled) {
        console.log(`${this.constructor.name}|Conversation`, conversation);
      }

      this.conversation = conversation;

      window.history.replaceState({}, '', `${baseUrl}/${conversation.id}`)

      // Listen to Conversation events
      //
      conversation.onModeratedChanged = (moderated: boolean) => {
        this.moderated = moderated;
      }
      conversation.onCandidateAdded = (candidate: User) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|onCandidateAdded`, candidate);
        }
        // Maintain local list of pending Candidates
        this.remoteCandidates.add(candidate);
      };
      conversation.onCandidateRemoved = (candidate: User) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|onCandidateRemoved`, candidate);
        }
        // Maintain local list of pending Candidates
        this.remoteCandidates.delete(candidate);
      };
      conversation.onParticipantAdded = (participant: RemoteParticipant) => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|onParticipantAdded`, participant);
        }

        this.remoteParticipants.add(participant);

        participant.user.onUserDataUpdate((userData: UserData) => {
          if (globalThis.logLevel.isInfoEnabled) {
            console.log(`${this.constructor.name}|onUserDataUpdate`, participant, userData);
          }
        })
        participant.onStreamPublished((stream: RemoteStream) => {
          if (globalThis.logLevel.isInfoEnabled) {
            console.log(`${this.constructor.name}|onStreamPublished`, participant, stream);
          }
          // First, set listener(s)
          this.doStoreRemoteStreamByParticipant(participant, stream);
          // And then, subscribe
          this.localParticipant?.subscribe(stream);
          // or 
          //this.localParticipant?.subscribe(stream, { audio: true, video: false });
        })
        participant.onStreamUnpublished((stream: RemoteStream) => {
          if (globalThis.logLevel.isInfoEnabled) {
            console.log(`${this.constructor.name}|onStreamUnpublished`, participant, stream);
          }
          this.doRemoveMediaStream(participant, stream);
        })
      };
      conversation.onParticipantRemoved = (participant: RemoteParticipant | LocalParticipant) => {
        if (globalThis.logLevel.isInfoEnabled) {
          console.log(`${this.constructor.name}|onParticipantRemoved`, participant);
        }
        if (participant instanceof RemoteParticipant) {
          this.doRemoveRemoteParticipant(participant);
        }
        else if (participant instanceof LocalParticipant) {
          if (globalThis.logLevel.isInfoEnabled) {
            console.log(`${this.constructor.name}|local user removed ?!`, participant);
          }
        }
      };

      conversation.onMessage((participant: User, message: Message) => {
        this.messages.push([participant.userData as UserData, message]);
      })

      // Join the conversation
      const userData: UserData = {
        nickname: this.authService.user?.displayName || 'guest',
        isModerator: this.moderator
      };
      this.localParticipantData = userData;

      this.isWaitingForAcceptance = true;
      conversation.addParticipant(userData, { moderator: this.moderator }).then((participant: LocalParticipant) => {
        if (globalThis.logLevel.isInfoEnabled) {
          console.log(`${this.constructor.name}|addParticipant succeed`, participant);
        }
        this.isWaitingForAcceptance = false;
        this.localParticipant = participant;

        this.publish()

        this.localParticipant.user.onUserDataUpdate((userData: UserData) => {
          if (globalThis.logLevel.isInfoEnabled) {
            console.log(`${this.constructor.name}|onUserDataUpdate`, this.localParticipant, userData);
          }
          this.localParticipantData = userData;
        })
      }).catch((error: any) => {
        if (globalThis.logLevel.isWarnEnabled) {
          console.warn(`${this.constructor.name}|addParticipant failed`, error);
        }
        this.isWaitingForAcceptance = false;
      });

      this.url = `${baseUrl}/${conversation.id}`;
    }).catch((error: any) => {
      console.error(`${this.constructor.name}|getOrCreate failed`, error);
    });
  }

  ngAfterViewInit() {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then((mediaStream: MediaStream) => {
      if (globalThis.logLevel.isDebugEnabled) {
        console.debug(`${this.constructor.name}|ngAfterViewInit getUserMedia`, mediaStream);
      }
      this.doStoreAndBindLocalMediaStream(mediaStream);
      this.publish()
    }).catch((error) => {
      console.error(`${this.constructor.name}|ngAfterViewInit getUserMedia`, error);
    });
  }

  onSnapshot(dataUrl: string) {
    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${this.constructor.name}|took snapshot`, dataUrl);
      //this.snapshotSrc = dataUrl;//URL.createObjectURL(snapshot);
      //data:image/png;base64,
      const type = dataUrl.split(';')[0].split('/')[1];
      saveAs(dataUrl, `snapshot_${(new Date().toJSON().slice(0,10))}.${type}`)
    }
  }

  doStoreAndBindLocalMediaStream(mediaStream: MediaStream) {
    this.localMediaStream = mediaStream;
    this.doGatherCapConstSettings();
    //this.doListenToTracksEvents(mediaStream, "LOCAL:");
  }

  echoCancellation = true;

  doGatherCapConstSettings() {
    if (this.localMediaStream) {
      for (const track of this.localMediaStream.getAudioTracks()) {
        if (typeof track.getCapabilities === 'function') {
          this.audioTrackCapabilities = track.getCapabilities();
        } else {
          if (globalThis.logLevel.isWarnEnabled) {
            console.warn(`${this.constructor.name}|getCapabilities not supported by browser`)
          }
        }
        if (typeof track.getConstraints === 'function') {
          this.audioTrackConstraints = track.getConstraints();
        } else {
          if (globalThis.logLevel.isWarnEnabled) {
            console.warn(`${this.constructor.name}|getConstraints not supported by browser`)
          }
        }
        if (typeof track.getSettings === 'function') {
          this.audioTrackSettings = track.getSettings();
        } else {
          if (globalThis.logLevel.isWarnEnabled) {
            console.warn(`${this.constructor.name}|getSettings not supported by browser`)
          }
        }
        break;
      }
      for (const track of this.localMediaStream.getVideoTracks()) {
        if (typeof track.getCapabilities === 'function') {
          this.videoTrackCapabilities = track.getCapabilities();
        } else {
          if (globalThis.logLevel.isWarnEnabled) {
            console.warn(`${this.constructor.name}|getCapabilities not supported by browser`)
          }
        }
        if (typeof track.getConstraints === 'function') {
          this.videoTrackConstraints = track.getConstraints();
        } else {
          if (globalThis.logLevel.isWarnEnabled) {
            console.warn(`${this.constructor.name}|getConstraints not supported by browser`)
          }
        }
        if (typeof track.getSettings === 'function') {
          this.videoTrackSettings = track.getSettings();
        } else {
          if (globalThis.logLevel.isWarnEnabled) {
            console.warn(`${this.constructor.name}|getSettings not supported by browser`)
          }
        }
        break;
      }
    }
  }

  // doListenToTracksEvents(mediaStream: MediaStream, logPrefix: string) {
  //   mediaStream.getTracks().forEach((track: MediaStreamTrack) => {
  //     track.onmute = (event) => {
  //       console.log(logPrefix + "onmute", mediaStream, track, event)
  //       if (this.localStream && (this.localStream.getMediaStream() === mediaStream)) {
  //         this.localStream.notifyTracksStatusChanged();
  //       }
  //     }
  //     track.onunmute = (event) => {
  //       console.log(logPrefix + "onunmute", mediaStream, track, event)
  //       if (this.localStream && (this.localStream.getMediaStream() === mediaStream)) {
  //         this.localStream.notifyTracksStatusChanged();
  //       }
  //     }
  //     track.onended = (event) => {
  //       console.log(logPrefix + "onended", mediaStream, track, event)
  //     }
  //   })
  // }

  blurredMediaStream: MediaStream | undefined;

  blur() {
    if (this.localStream && this.localMediaStream) {
      this.blurredMediaStream = this.localMediaStream;
      this.localMediaStream = MediaStreamHelper.blur(this.localMediaStream);
      this.localStream.replaceMediaStream(this.localMediaStream);
    }
  }

  ngOnDestroy(): void {
    this.doCleanUp();
  }

  public signOut() {
    if (this.conversation) {
      this.conversation.close().then(() => {
        this.conversation = undefined;
        if (globalThis.logLevel.isInfoEnabled) {
          console.info(`${this.constructor.name}|Conversation closed`);
        }
      }).catch((error: any) => {
        console.error(`${this.constructor.name}|Conversation closing error`, error)
      }).finally(() => {
        this.doSignOut();
      });
    } else {
      this.doSignOut();
    }
  }

  private doSignOut() {
    // TODO: migrate !
    // firebase.auth().signOut().then(() => {
    //   if (globalThis.logLevel.isInfoEnabled) {
    //     console.info(`${this.constructor.name}|signed Out`);
    //   }
    //   this.router.navigate(['/login']);
    // }).catch(error => {
    //   console.error(`${this.constructor.name}|doSignOut`, error)
    // });
  }

  // --------------------------------------------------------------------------

  private doCleanUp() {
    if (this.conversation) {
      this.conversation.close().then(() => {
        this.conversation = undefined;
        if (globalThis.logLevel.isInfoEnabled) {
          console.info(`${this.constructor.name}|Conversation closed`);
        }
      }).catch((error: any) => {
        console.error(`${this.constructor.name}|Conversation closing error`, error)
      });
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
      console.error(`${this.constructor.name}|Cannot sendMessage`, this.localParticipant);
    }
  }

  // TODO : implement a sendPrivateMessage in the library ?

  publish() {
    if (this.localMediaStream && this.localParticipant) {
      this.localStream = this.localParticipant.publish(this.localMediaStream, { topic: 'webcam', audio: true });
      // Or
      //this.localParticipant.publish(this.localMediaStream, { type: 'webcam', foo: 'bar' });
    } else {
      console.error(`${this.constructor.name}|Cannot publish`, this.localMediaStream, this.localParticipant);
    }
  }

  unpublish() {
    if (this.localMediaStream) {
      this.localParticipant?.unpublish(this.localMediaStream);
      this.localStream = undefined;
    }
  }

  private doStoreRemoteStreamByParticipant(participant: RemoteParticipant, stream: RemoteStream) {
    if (!this.remoteStreamsByParticipant.has(participant)) {
      this.remoteStreamsByParticipant.set(participant, new Set());
    }
    this.remoteStreamsByParticipant.get(participant)?.add(stream);
  }

  private doRemoveMediaStream(participant: RemoteParticipant, stream: RemoteStream) {
    const deleted = this.remoteStreamsByParticipant.get(participant)?.delete(stream);
    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${this.constructor.name}|doRemoveMediaStream`, participant, stream, deleted);
    }
  }

  private doRemoveRemoteParticipant(participant: RemoteParticipant) {
    this.remoteParticipants.delete(participant);
    const deleted = this.remoteStreamsByParticipant.delete(participant);
    if (globalThis.logLevel.isDebugEnabled) {
      console.debug(`${this.constructor.name}|doRemoveRemoteParticipant`, participant, deleted, this.remoteStreamsByParticipant.size);
    }
  }

  shareScreen() {
    // @ts-ignore (https://github.com/microsoft/TypeScript/issues/33232)
    navigator.mediaDevices.getDisplayMedia().then((mediaStream: MediaStream) => {
      this.localDisplayMediaStream = mediaStream;
      if (globalThis.logLevel.isDebugEnabled) {
        console.debug(`${this.constructor.name}|shareScreen getDisplayMedia`, mediaStream)
      }
      if (this.localParticipant) {
        this.localParticipant.publish(mediaStream, { topic: 'screen' });
      }
    }).catch((error: any) => {
      console.error(`${this.constructor.name}|shareScreen`, error);
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
        console.error(`${this.constructor.name}|goHd`, error);
      });
  }

  doApplyAudioConstraint(constraintName: string, value: ConstrainULong | ConstrainDouble | ConstrainBoolean | ConstrainDOMString) {
    if (this.localMediaStream) {
      this.localMediaStream.getAudioTracks().forEach(track => {
        const settings: MediaTrackSettings = track.getSettings();
        const constraints: any = settings;
        constraints[constraintName] = value;
        track.applyConstraints(constraints).then(() => {
          this.doGatherCapConstSettings();
        });
      });
    }
  }

  goHDByApplyConstraints() {
    //MediaStreamTrack should have method :
    //Promise<undefined> applyConstraints(optional MediaTrackConstraints constraints = {});
    if (this.localMediaStream) {
      this.localMediaStream.getVideoTracks().forEach(track => {
        const constraints: MediaTrackConstraints = { width: { exact: 1280 }, height: { exact: 720 } }
        track.applyConstraints(constraints).then(() => {
          if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${this.constructor.name}|applyConstraints done`, this.localMediaStream, constraints);
          }
          this.doGatherCapConstSettings();
        }).catch(error => {
          console.error(`${this.constructor.name}|track.applyConstraints error`, error);
        });
      });
    }
  }

  frameRate24() {
    //MediaStreamTrack shoud have method :
    //Promise<undefined> applyConstraints(optional MediaTrackConstraints constraints = {});
    if (this.localMediaStream) {
      this.localMediaStream.getVideoTracks().forEach(track => {
        const constraints: MediaTrackConstraints = { frameRate: 24 }
        track.applyConstraints(constraints).then(() => {
          if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${this.constructor.name}|applyConstraints done`, this.localMediaStream, constraints);
          }
          this.doGatherCapConstSettings();
        }).catch(error => {
          console.error("applyConstraints error", error);
        });
      });
    }
  }

  applyMediaStreamConstraintsHD(remoteStream: RemoteStream) {
    //const constraints: MediaStreamConstraints | any = ;
    //const constraints: MediaStreamConstraints = { video: { height: { exact: 720 }, width: { exact: 1280 }, advanced: [{ zoom: 4 }] } };
    //, advanced: [{ zoom: 2 }]
    remoteStream.applyMediaStreamConstraints({ video: { height: { exact: 720 }, width: { exact: 1280 }, advanced: [{ torch: true }] } })
      .then(() => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|applyMediaStreamConstraints done`);
        }
      })
      .catch((error: any) => {
        console.error(`${this.constructor.name}|applyMediaStreamConstraints error`, error)
      });
  }

  applyMediaStreamConstraintsVGA(remoteStream: RemoteStream) {
    //const constraints: MediaStreamConstraints | any = ;
    //{ video: { zoom: 4 } }
    //{ video: { height: { exact: 480 }, width: { exact: 640 } } }
    remoteStream.applyMediaStreamConstraints({ video: { height: { exact: 480 }, width: { exact: 640 }, advanced: [{ torch: false }] } })
      .then(() => {
        if (globalThis.logLevel.isDebugEnabled) {
          console.debug(`${this.constructor.name}|applyMediaStreamConstraints done`);
        }
      })
      .catch((error: any) => {
        console.error(`${this.constructor.name}|applyMediaStreamConstraints error`, error)
      });
  }

  mediaRecorder: MediaRecorder | undefined;
  recordedBlobs: Array<Blob> = new Array();

  record(mediaStream: MediaStream) {
    this.mediaRecorder = new MediaRecorder(mediaStream);
    this.mediaRecorder.onstop = (event: any) => {
      if (globalThis.logLevel.isInfoEnabled) {
        console.info(`${this.constructor.name}|Recorder stopped`, event);
      }
    };
    this.mediaRecorder.ondataavailable = (event: any) => {
      if (globalThis.logLevel.isDebugEnabled) {
        console.debug(`${this.constructor.name}|ondataavailable`, event);
      }
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
