import { Component, HostListener, OnDestroy, OnInit } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import { Meta } from "@angular/platform-browser";
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from "@angular/material/snack-bar";
import { SnackBarMessageComponent } from "./components/snack-bar-message/snack-bar-message.component";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Functions } from "@angular/fire/functions";
import { Store } from "@ngrx/store";
import { focusOnAddTaskInput, focusOnSearchInput } from "./core/actions/ui.actions";
import { homeRoutesName } from "./routing.module.name";
import { editTaskRoutesName } from "./modules/edit-task/routes-names";
import { Router, RouterOutlet } from "@angular/router";
import { editProjectSettingsRoutesName } from "./modules/edit-project/routes-names";
import { NGXLogger } from "ngx-logger";

@Component({
    selector: "tickist-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    standalone: true,
    imports: [RouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
    snackBarRef: MatSnackBarRef<any>;
    config: MatSnackBarConfig;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private swUpdate: SwUpdate,
        private meta: Meta,
        private snackBar: MatSnackBar,
        // private afMessaging: AngularFireMessaging,
        private store: Store,
        private readonly aff: Functions,
        private readonly router: Router,
        private logger: NGXLogger,
    ) {
        this.config = new MatSnackBarConfig();
        this.config.panelClass = ["tickist-web-snack-bar"];
    }

    @HostListener("window:keydown", ["$event"])
    keyEvent(event: KeyboardEvent) {
        if (event.key === "f" && event.ctrlKey) {
            event.preventDefault();
            this.store.dispatch(focusOnSearchInput());
        }
        if (event.key === "a" && event.ctrlKey) {
            event.preventDefault();
            this.store.dispatch(focusOnAddTaskInput());
        }
        if ((event.key === "a" || event.key === "A") && event.ctrlKey && event.shiftKey) {
            event.preventDefault();
            this.router.navigate([homeRoutesName.home, editTaskRoutesName.editTask]);
        }

        if ((event.key === "p" || event.key === "P") && event.ctrlKey && event.shiftKey) {
            event.preventDefault();
            this.router.navigate([homeRoutesName.home, editProjectSettingsRoutesName.editProject]);
        }
    }

    ngOnInit(): void {
        // if (environment.emulator) {
        //     this.aff
        //         .useFunctionsEmulator("http://localhost:5001")
        //         .then(() => this.logger.info("Using functions emulator"));
        // }
        if (this.swUpdate.isEnabled) {
            this.swUpdate.checkForUpdate().then((isUpdateAvailable) => {
                if (isUpdateAvailable) {
                    this.snackBarRef = this.snackBar.openFromComponent(SnackBarMessageComponent, this.config);
                    this.snackBarRef
                        .onAction()
                        .pipe(takeUntil(this.ngUnsubscribe))
                        .subscribe(() => {
                            window.location.reload();
                        });
                }
            });
        }
        // @TODO  not working
        // this.afMessaging.messages
        //     .pipe(takeUntil(this.ngUnsubscribe))
        //     .subscribe((message) => {
        //         this.logger.log(message);
        //     });

        this.meta.addTags(
            [
                {
                    name: "description",
                    content:
                        "To-do-list application inspired by GTD methodology and life experience. " +
                        "Join us and create tasks, projects, tags. We are open source.",
                },
                {
                    name: "viewport",
                    content: "width=device-width, initial-scale=1",
                },
                { name: "robots", content: "INDEX, FOLLOW" },
                { name: "author", content: "Tickist" },
                {
                    name: "keywords",
                    content: "Todo list, Todo-list, GTD, tickist-web, task, project",
                },
                { httpEquiv: "Content-Type", content: "text/html" },
                {
                    property: "og:title",
                    content: "Tickist - Enjoy the Ticking",
                },
                { property: "og:type", content: "website" },
                { charset: "UTF-8" },
            ],
            true,
        );
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
