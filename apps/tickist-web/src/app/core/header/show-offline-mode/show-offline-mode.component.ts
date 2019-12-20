import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {AppStore} from '../../../store';
import {Store} from '@ngrx/store';

@Component({
    selector: 'tickist-show-offline-mode',
    templateUrl: './show-offline-mode.component.html',
    styleUrls: ['./show-offline-mode.component.scss']
})
export class ShowOfflineModeComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    isOffline$: Observable<boolean>;
    isOffline: boolean;
    interval = 5000;
    pingObject: any;
    pingCheck: any;
    ping: any;

    constructor(private store: Store<AppStore>, private cd: ChangeDetectorRef, private ngZone: NgZone) {
    }

    ngOnInit() {
        // this.isOffline$ = this.store.select(selectOfflineModeBarIsVisible);
        // this.isOffline$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(val => {
        //     this.isOffline = val;
        // });
        // @TODO is not working we need to fix it
        // this.ping = () => {
        //     this.pingObject.ping('https://app.tickist.com', (err, data) => {
        //     if (err && !this.isOffline) {
        //         this.store.dispatch(new ShowOfflineModeBar());
        //     } else if (!err && this.isOffline) {
        //         this.store.dispatch(new HideOfflineModeBar());
        //     }
        // });
        // };
        // this.ngZone.runOutsideAngular(() => {
        //     this.pingCheck = setInterval(() => {
        //         this.ngZone.run(() => {
        //            this.ping();
        //         });
        //     }, this.interval );
        // });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}



