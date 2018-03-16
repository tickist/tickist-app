import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ConfigurationService} from '../services/configurationService';
import {Subject} from 'rxjs/Subject';
import {Ping} from './ping';

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

    constructor(protected configurationService: ConfigurationService, private cd: ChangeDetectorRef) {
        this.pingObject = new Ping();
    }

    ngOnInit() {

        this.configurationService.offlineModeNotification$.takeUntil(this.ngUnsubscribe).subscribe(value => {
            this.isOffline = value;
            this.cd.markForCheck();
        });

        this.ping = () => {
            this.pingObject.ping('https://tickist.com', (err, data) => {
            if (err) {
                this.configurationService.updateOfflineModeNotification(true);
            } else {
                this.configurationService.updateOfflineModeNotification(false);
            }
        });
        };
        this.pingCheck = setInterval(this.ping, this.interval );
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        clearInterval(this.pingCheck);
    }

}



