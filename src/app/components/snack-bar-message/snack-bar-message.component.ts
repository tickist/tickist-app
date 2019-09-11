import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import {interval, noop, Observable} from 'rxjs';
import {map, shareReplay, take} from 'rxjs/operators';

@Component({
    selector: 'tickist-snack-bar-message',
    templateUrl: './snack-bar-message.component.html',
    styleUrls: ['./snack-bar-message.component.scss']
})
export class SnackBarMessageComponent implements OnInit, OnDestroy {
    timer$: Observable<number>;

    constructor(public snackBar: MatSnackBar) {
    }

    ngOnInit() {
        const time = 600; // 5 seconds
        this.timer$ = interval(1000).pipe(
            take(time),
            map((v) => (time - 1) - v),
            shareReplay()
        );
        this.timer$.subscribe(noop, noop, () => {
            this.sendYes();
        });
    }

    sendYes() {
        this.snackBar.dismiss();
        window.location.reload();
    }

    ngOnDestroy() {

    }
}