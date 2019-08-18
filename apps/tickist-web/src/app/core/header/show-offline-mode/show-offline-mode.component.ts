import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ConfigurationService} from '../../services/configuration.service';
import {Subject, pipe, Observable} from 'rxjs';
import {Ping} from './ping';
import {takeUntil} from 'rxjs/operators';
import {AppStore} from '../../../store';
import {Store} from '@ngrx/store';
import {selectOfflineModeBarIsVisible} from '../../../reducers/core.selectors';
import {HideOfflineModeBar, ShowOfflineModeBar} from '../../actions/offline-mode.actions';

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
        this.pingObject = new Ping();
    }

    ngOnInit() {
        this.isOffline$ = this.store.select(selectOfflineModeBarIsVisible);
        this.isOffline$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(val => {
            this.isOffline = val;
        });

        this.ping = () => {
            this.pingObject.ping('https://app.tickist.com', (err, data) => {
            if (err && !this.isOffline) {
                this.store.dispatch(new ShowOfflineModeBar());
            } else if (!err && this.isOffline) {
                this.store.dispatch(new HideOfflineModeBar());
            }
        });
        };
        this.ngZone.runOutsideAngular(() => {
            this.pingCheck = setInterval(() => {
                this.ngZone.run(() => {
                   this.ping();
                });
            }, this.interval );
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        clearInterval(this.pingCheck);
    }

}



