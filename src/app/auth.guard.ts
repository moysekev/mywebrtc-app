import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(private router: Router,
    private authService: AuthService) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.user === undefined) {
      return new Promise((resolve) => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        this.authService.user$.subscribe({
          next(user) {
            if (user) {
              if (globalThis.logLevel.isDebugEnabled) {
                console.debug(`${this.constructor.name}|canActivate => resolve(true)`, user)
              }
              resolve(true);
            } else { resolve(false) }
          }
        })
      })
    }
    else if (this.authService.user !== null) {
      if (globalThis.logLevel.isDebugEnabled) {
        console.debug(`${this.constructor.name}|canActivate => return true`, this.authService.user)
      }
      return true;
    }
    else {
      if (globalThis.logLevel.isDebugEnabled) {
        console.debug(`${this.constructor.name}|canActivate => return false`)
      }
      //this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  }

}
