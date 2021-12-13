import { APP_INITIALIZER, NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { DateAdapter } from "@angular/material/core";
import { BrowserModule } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActionReducerMap, StoreModule } from "@ngrx/store";
import { ServiceWorkerModule } from "@angular/service-worker";
import { FlexLayoutModule } from "@angular/flex-layout";
import { AppComponent } from "./app.component";
import { TimeDialogComponent } from "./single-task/time-dialog/time-dialog.component";
import { TypeFinishDateString } from "./shared/pipes/typeFinishDateString";
import { metaReducers } from "./store";
import { DeleteTaskDialogComponent } from "./single-task/delete-task-dialog/delete-task.dialog.component";
import { RootComponent } from "./testing/test.modules";
import { MyDateAdapter } from "./shared/data-adapter";
import { environment } from "../environments/environment";
import { TickistMaterialModule } from "./material.module";
import { ChangeFinishDateDialogComponent } from "./single-task/change-finish-date-dialog/change-finish-date-dialog.component";
import { TickistRoutingModule } from "./routing.module";
import { TickistSharedModule } from "./shared/shared.module";
import { TickistSingleTaskModule } from "./single-task/single-task.module";
import { EffectsModule } from "@ngrx/effects";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { TickistCoreModule } from "./core/core.module";
import { SortablejsModule } from "ngx-sortablejs";
import { SnackBarMessageComponent } from "./components/snack-bar-message/snack-bar-message.component";
import { IconsModule } from "./icons.module";
import { TickistNotificationsModule } from "./modules/notifications/notifications.module";
import { TickistLeftPanelModule } from "./modules/left-panel/left-panel.module";
import { reducer as addTaskComponentVisibilityReducer } from "./reducers/add-task-component-visibility";
import { reducer as leftSidenavVisibility } from "./reducers/left-sidenav-visibility";
import { LoggerModule } from "ngx-logger";
import { HttpClientModule } from "@angular/common/http";
import { provideFirebaseApp } from "@angular/fire/app";
import { initializeApp } from "firebase/app";
import {
    connectFirestoreEmulator,
    enableIndexedDbPersistence,
    enableMultiTabIndexedDbPersistence,
    getFirestore,
    provideFirestore,
} from "@angular/fire/firestore";
import { connectStorageEmulator, getStorage, provideStorage } from "@angular/fire/storage";
import { getMessaging, isSupported, provideMessaging } from "@angular/fire/messaging";
import { connectAuthEmulator, getAuth, provideAuth } from "@angular/fire/auth";
import { connectFunctionsEmulator, getFunctions, provideFunctions } from "@angular/fire/functions";
import { initializeFirestore } from "@firebase/firestore";

console.log({ environment });

@NgModule({
    declarations: [
        AppComponent,
        DeleteTaskDialogComponent,
        TimeDialogComponent,
        TypeFinishDateString,
        ChangeFinishDateDialogComponent,
        RootComponent,
        SnackBarMessageComponent,
    ],
    imports: [
        HttpClientModule,
        LoggerModule.forRoot(environment.logger),
        TickistSharedModule,
        TickistSingleTaskModule,
        BrowserModule,
        BrowserAnimationsModule,
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
            }
        ),
        StoreDevtoolsModule.instrument({
            maxAge: 50, // Retains last 25 states
            logOnly: environment.production, // Restrict extension to log-only mode
        }),
        SortablejsModule.forRoot({
            animation: 150,
        }),
        TickistMaterialModule,
        FlexLayoutModule,
        ServiceWorkerModule.register("/combined-sw.js", {
            registrationStrategy: "registerWhenStable:30000",
            enabled: environment.production,
        }),
        ServiceWorkerModule.register("/firebase-messaging-sw.js", {
            registrationStrategy: "registerWhenStable:30000",
            enabled: !environment.production,
        }),
        EffectsModule.forRoot([]),
        TickistRoutingModule,
        TickistCoreModule,
        IconsModule,

        TickistNotificationsModule,
        TickistLeftPanelModule,
        provideFirebaseApp(() => {
            const firebase = initializeApp(environment.firebase);
            let config = {};
            if (environment.emulator) {
                config = {
                    experimentalForceLongPolling: true,
                };
            }
            initializeFirestore(firebase, config);
            return firebase;
        }),
        provideFirestore(() => {
            const firestore = getFirestore();
            if (environment.emulator) {
                connectFirestoreEmulator(firestore, "localhost", 8080, {});
            } else {
                enableIndexedDbPersistence(firestore);
            }
            // enableMultiTabIndexedDbPersistence(firestore);
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
    ],
    bootstrap: [AppComponent],
    providers: [{ provide: DateAdapter, useClass: MyDateAdapter }],
})
export class AppModule {}
