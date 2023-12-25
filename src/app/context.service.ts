import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';

@Injectable({
  providedIn: 'root'
})
export class ContextService {

  nickname: string = "";
  private nicknameSubject = new Subject<string>();
  nickname$: Observable<string> = this.nicknameSubject.asObservable();

  constructor() { }

  setNickname(value: string) {
    this.nickname = value;
    this.nicknameSubject.next(value);
  }
}
