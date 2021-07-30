import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.user === undefined) {
      console.log('AuthGuard::canActivate => Promise');
      return new Promise((resolve) => {
        this.authService.user$.subscribe({
          next(user) {
            if (user) {
              console.log('AuthGuard::canActivate => resolve(true)');
              resolve(true);
            }
            else { resolve(false) }
          }
        })
      });
    }
    else if (this.authService.user !== null) {
      console.log('AuthGuard::canActivate => return true');
      return true;
    }
    else {
      console.log('AuthGuard::canActivate => return false');
      return false;
    }
  }

}
