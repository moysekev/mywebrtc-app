import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ByeComponent } from './bye/bye.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';

import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'home/:id', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'bye', component: ByeComponent },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: ':id', redirectTo: '/home/:id', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
