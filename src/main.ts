import { enableProdMode, importProvidersFrom } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

import { setLogLevel as setMyWebRtcLogLevel } from 'mywebrtc/dist';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { AuthGuard } from './app/auth.guard';
import { WINDOW_PROVIDERS } from './app/windows-provider';
import { environment } from './environments/environment';
import { setLogLevel } from './logLevel';

setLogLevel('debug')
setMyWebRtcLogLevel('debug')

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatGridListModule, MatCardModule),
        WINDOW_PROVIDERS, AuthGuard,
        provideAnimations()
    ]
})
  .catch(err => console.error(err));
