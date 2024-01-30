import { environment } from "./environments/environment";

import { enableProdMode, importProvidersFrom } from "@angular/core";
import { AppComponent } from "./app/app.component";
import { connectFunctionsEmulator, getFunctions, provideFunctions } from "@angular/fire/functions";
import { connectAuthEmulator, getAuth, provideAuth } from "@angular/fire/auth";
import { getMessaging, provideMessaging } from "@angular/fire/messaging";
import { connectStorageEmulator, getStorage, provideStorage } from "@angular/fire/storage";
import { connectFirestoreEmulator, getFirestore, provideFirestore, setLogLevel } from "@angular/fire/firestore";
import { initializeFirestore } from "@firebase/firestore";
import { initializeApp } from "firebase/app";
import { provideFirebaseApp } from "@angular/fire/app";
import { TickistLeftPanelModule } from "./app/modules/left-panel/left-panel.module";
import { IconsModule } from "./app/icons.module";
import { TickistCoreModule } from "./app/core/core.module";
import { TickistRoutingModule } from "./app/routing.module";
import { EffectsModule } from "@ngrx/effects";
import { ServiceWorkerModule } from "@angular/service-worker";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { TickistMaterialModule } from "./app/material.module";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { metaReducers } from "./app/store";
import { reducer as leftSidenavVisibility } from "./app/reducers/left-sidenav-visibility";
import { reducer as addTaskComponentVisibilityReducer } from "./app/reducers/add-task-component-visibility";
import { ActionReducerMap, StoreModule } from "@ngrx/store";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { provideAnimations } from "@angular/platform-browser/animations";
import { bootstrapApplication, BrowserModule } from "@angular/platform-browser";
import { TickistSingleTaskModule } from "./app/single-task/single-task.module";
import { TickistSharedModule } from "./app/shared/shared.module";

import { LoggerModule } from "ngx-logger";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { MyDateAdapter } from "./app/shared/data-adapter";
import { DateAdapter } from "@angular/material/core";

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(
            LoggerModule.forRoot(environment.logger),
            TickistSharedModule,
            TickistSingleTaskModule,
            BrowserModule,
            CommonModule,
            FormsModule,
            ReactiveFormsModule,
            StoreModule.forRoot(
                {
                    addTaskComponentVisibilityReducer: addTaskComponentVisibilityReducer,
                    leftSidenavVisibility: leftSidenavVisibility,
                } as ActionReducerMap<any>,
                {
                    initialState: {},
                    metaReducers,
                    runtimeChecks: {
                        strictStateImmutability: true,
                        strictActionImmutability: true,
                    },
                },
            ),
            StoreDevtoolsModule.instrument({
                maxAge: 50,
                logOnly: environment.production,
                connectInZone: true,
            }),
            TickistMaterialModule,
            FlexLayoutModule,
            ServiceWorkerModule.register("/combined-sw.js", {
                registrationStrategy: "registerWhenStable:30000",
                enabled: environment.production && !environment.e2eTest,
            }),
            ServiceWorkerModule.register("/firebase-messaging-sw.js", {
                registrationStrategy: "registerWhenStable:30000",
                enabled: !environment.production && !environment.e2eTest,
            }),
            EffectsModule.forRoot([]),
            TickistRoutingModule,
            TickistCoreModule,
            IconsModule,
            // TickistNotificationsModule,
            TickistLeftPanelModule,
            provideFirebaseApp(() => {
                const firebase = initializeApp(environment.firebase);
                let config = {};
                if (environment.emulator) {
                    config = {
                        merge: true,
                        experimentalAutoDetectLongPolling: true,
                    };
                }
                initializeFirestore(firebase, config);
                return firebase;
            }),
            provideFirestore(() => {
                const firestore = getFirestore();
                setLogLevel("info");
                if (environment.emulator) {
                    connectFirestoreEmulator(firestore, "127.0.0.1", 8080, {});
                }
                return firestore;
            }),
            provideStorage(() => {
                const storage = getStorage();
                if (environment.emulator) {
                    connectStorageEmulator(storage, "localhost", 9199);
                }
                return getStorage();
            }),
            provideMessaging(() => {
                const messaging = getMessaging();
                return messaging;
            }),
            provideAuth(() => {
                const auth = getAuth();
                if (environment.authEmulator) {
                    connectAuthEmulator(auth, "http://localhost:9099");
                }
                return auth;
            }),
            provideFunctions(() => {
                const functions = getFunctions();
                if (environment.emulator) {
                    connectFunctionsEmulator(functions, "localhost", 5001);
                }
                return functions;
            }),
        ),
        { provide: DateAdapter, useClass: MyDateAdapter },
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations(),
    ],
}).catch((err) => console.log(err));
