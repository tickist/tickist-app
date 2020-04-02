import {Component, OnDestroy, OnInit} from '@angular/core'; // Recommended
import {SwUpdate} from '@angular/service-worker';
import {Meta} from '@angular/platform-browser';
import { MatSnackBar, MatSnackBarRef, MatSnackBarConfig } from '@angular/material/snack-bar';
import {SnackBarMessageComponent} from './components/snack-bar-message/snack-bar-message.component';
import {AngularFireMessaging} from '@angular/fire/messaging';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';


@Component({
  selector: 'tickist-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    snackBarRef: MatSnackBarRef<any>;
    config: MatSnackBarConfig;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private swUpdate: SwUpdate, private meta: Meta, private snackBar: MatSnackBar, private afMessaging: AngularFireMessaging) {
        this.config = new MatSnackBarConfig();
        this.config.panelClass = ['tickist-web-snack-bar'];
    }

    ngOnInit(): void {
        if (this.swUpdate.isEnabled) {
            this.swUpdate.available.pipe(
                takeUntil(this.ngUnsubscribe)
            ).subscribe(() => {
                this.snackBarRef = this.snackBar.openFromComponent(SnackBarMessageComponent, this.config);
                this.snackBarRef.onAction().pipe(
                    takeUntil(this.ngUnsubscribe)
                ).subscribe(() => {
                    window.location.reload();
                });
            });
        }

        this.afMessaging.messages.pipe(
            takeUntil(this.ngUnsubscribe)
            ).subscribe((message) => { console.log(message); });

        this.meta.addTags([
            {name: 'description', content: 'To-do-list application inspired by GTD methodology and life experience. ' +
                    'Join us and create tasks, projects, tags. We are open source.'},
            {name: 'viewport', content: 'width=device-width, initial-scale=1'},
            {name: 'robots', content: 'INDEX, FOLLOW'},
            {name: 'author', content: 'Tickist'},
            {name: 'keywords', content: 'Todo list, Todo-list, GTD, tickist-web, task, project'},
            {httpEquiv: 'Content-Type', content: 'text/html'},
            {property: 'og:title', content: 'Tickist - Enjoy the Ticking'},
            {property: 'og:type', content: 'website'},
            {charset: 'UTF-8'}
        ], true);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
