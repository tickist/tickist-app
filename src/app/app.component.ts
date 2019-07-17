import {Component, OnInit} from '@angular/core';
import 'hammerjs'; // Recommended
// import gitInfo from '../git-version.json';
import {SwUpdate} from '@angular/service-worker';
import {Meta} from '@angular/platform-browser';
import { MatSnackBar, MatSnackBarRef, MatSnackBarConfig } from '@angular/material/snack-bar';
import {SnackBarMessageComponent} from './components/snack-bar-message/snack-bar-message.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    snackBarRef: MatSnackBarRef<any>;
    config: MatSnackBarConfig;

    constructor(private swUpdate: SwUpdate, private meta: Meta, private snackBar: MatSnackBar) {
        this.config = new MatSnackBarConfig();
        this.config.panelClass = ['tickist-snack-bar'];
        // console.log(gitInfo);
    }

    ngOnInit(): void {
        if (this.swUpdate.isEnabled) {
            this.swUpdate.available.subscribe(() => {
                this.snackBarRef = this.snackBar.openFromComponent(SnackBarMessageComponent, this.config);
                this.snackBarRef.onAction().subscribe(() => {
                    window.location.reload();
                });
            });
        }

        this.meta.addTags([
            {name: 'description', content: 'To-do-list application inspired by GTD methodology and life experience. ' +
                    'Join us and create tasks, projects, tags. We are open source.'},
            {name: 'viewport', content: 'width=device-width, initial-scale=1'},
            {name: 'robots', content: 'INDEX, FOLLOW'},
            {name: 'author', content: 'Tickist'},
            {name: 'keywords', content: 'Todo list, Todo-list, GTD, tickist, task, project'},
            {httpEquiv: 'Content-Type', content: 'text/html'},
            {property: 'og:title', content: 'Tickist - Enjoy the Ticking'},
            {property: 'og:type', content: 'website'},
            {charset: 'UTF-8'}
        ], true);
    }
}
