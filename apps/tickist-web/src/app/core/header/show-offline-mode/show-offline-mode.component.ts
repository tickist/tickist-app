import { ChangeDetectorRef, Component, NgZone, OnDestroy } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { Store } from "@ngrx/store";
import { NgIf, AsyncPipe } from "@angular/common";

@Component({
    selector: "tickist-show-offline-mode",
    templateUrl: "./show-offline-mode.component.html",
    styleUrls: ["./show-offline-mode.component.scss"],
    standalone: true,
    imports: [NgIf, AsyncPipe],
})
export class ShowOfflineModeComponent implements OnDestroy {
    isOffline$: Observable<boolean>;
    isOffline: boolean;
    interval = 5000;
    pingObject: any;
    pingCheck: any;
    ping: any;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(
        private store: Store,
        private cd: ChangeDetectorRef,
        private ngZone: NgZone,
    ) {}

    // ngOnInit() {
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
    // }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
