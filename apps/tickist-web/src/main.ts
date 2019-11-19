import {environment} from './environments/environment';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {AppModule} from './app';
import {enableProdMode} from '@angular/core';
import 'hammerjs';
import LogRocket from 'logrocket';


if (environment.production) {
    enableProdMode();
    LogRocket.init('atlbfn/tickist-web');
}

platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.log(err));
