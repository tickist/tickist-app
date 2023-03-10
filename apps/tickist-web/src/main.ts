import { environment } from "./environments/environment";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app";
import { enableProdMode } from "@angular/core";

if (environment.production) {
    enableProdMode();
}

// platformBrowserDynamic().bootstrapModule(AppModule)
//     .catch(err => console.log(err));

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.log(err));
