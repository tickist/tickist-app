import {Component, OnDestroy, OnInit} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {interval, noop, Observable, Subject} from 'rxjs';
import {map, shareReplay, take, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'tickist-snack-bar-message',
    templateUrl: './snack-bar-message.component.html',
    styleUrls: ['./snack-bar-message.component.scss']
})
export class SnackBarMessageComponent implements OnInit, OnDestroy {
    timer$: Observable<number>;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public snackBar: MatSnackBar) {
    }

    ngOnInit() {
        const time = 600; // 5 seconds
        this.timer$ = interval(1000).pipe(
            take(time),
            map((v) => (time - 1) - v),
            takeUntil(this.ngUnsubscribe),
            shareReplay()
        );
        this.timer$.pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe(noop, noop, () => {
            this.sendYes();
        });
    }

    sendYes() {
        this.snackBar.dismiss();
        window.location.reload();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
