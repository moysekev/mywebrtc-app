import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ByeComponent } from './bye/bye.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';

import { AuthGuard } from './auth.guard';
import { APP_BASE_HREF } from '@angular/common';

const routes: Routes = [
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'home/:id', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'bye', component: ByeComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: ':id', redirectTo: '/home/:id', pathMatch: 'full' }
];

// https://angular.io/guide/router#base-href
//https://angular.io/api/common/APP_BASE_HREF
@NgModule({
  providers: [{ provide: APP_BASE_HREF, useValue: '/mywebrtc-app/' }],
  imports: [RouterModule.forRoot(routes, { useHash: true })], //useHash: true
  exports: [RouterModule]
})
export class AppRoutingModule { }
