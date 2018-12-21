import {ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ConfigurationService} from '../services/configuration.service';
import {Subject, pipe} from 'rxjs';
import {Ping} from './ping';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'tickist-show-offline-mode',
    templateUrl: './show-offline-mode.component.html',
    styleUrls: ['./show-offline-mode.component.scss']
})
export class ShowOfflineModeComponent implements OnInit, OnDestroy {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    isOffline = true;
    interval = 5000;
    pingObject: any;
    pingCheck: any;
    ping: any;

    constructor(protected configurationService: ConfigurationService, private cd: ChangeDetectorRef, private ngZone: NgZone) {
        this.pingObject = new Ping();
    }

    ngOnInit() {

        this.configurationService.offlineModeNotification$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(value => {
            this.isOffline = value;
            this.cd.markForCheck();
        });

        this.ping = () => {
            this.pingObject.ping('https://app.tickist.com', (err, data) => {
            if (err) {
                this.configurationService.updateOfflineModeNotification(true);
            } else {
                this.configurationService.updateOfflineModeNotification(false);
            }
        });
        };
        this.ngZone.runOutsideAngular(() => {
            setInterval(() => {
                this.ngZone.run(() => {
                   this.ping();
                });
            }, this.interval );
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        //clearInterval(this.pingCheck);
    }

}



