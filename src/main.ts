import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { setLogLevel } from './logLevel';
import { setLogLevel as setMyWebRtcLogLevel } from 'mywebrtc/dist';

setLogLevel('debug')
setMyWebRtcLogLevel('debug')

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
