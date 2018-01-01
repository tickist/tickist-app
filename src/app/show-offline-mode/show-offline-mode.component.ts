import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ConfigurationService} from '../services/configurationService';
import {Subject} from 'rxjs/Subject';

@Component({
    selector: 'tickist-show-offline-mode',
    templateUrl: './show-offline-mode.component.html',
    styleUrls: ['./show-offline-mode.component.scss']
})
export class ShowOfflineModeComponent implements OnInit {
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    isOffline = true;
    interval = 5000;
    pingObject: any;
    pingCheck: any;
    
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


class Ping {
    constructor(opt) {
        this.opt = opt || {};
        this.favicon = this.opt.favicon || '/favicon.ico';
        this.timeout = this.opt.timeout || 0;
    }
    
    ping(source, callback) {
        this.img = new Image();
        let  timer;
        
        let start = new Date();
        this.img.onload = pingCheck;
        this.img.onerror = pingCheck;
        if (this.timeout) {
            timer = setTimeout(pingCheck, this.timeout);
        }
        
        /**
         * Times ping and triggers callback.
         */
        function pingCheck(e) {
            if (timer) {
                clearTimeout(timer);
            }
            const pong = new Date() - start;
            
            if (typeof callback === 'function') {
                if (e.type === 'error') {
                    console.error('error loading resource');
                    return callback('error', pong);
                }
                return callback(null, pong);
            }
        }
        
        this.img.src = source + this.favicon + '?' + (+new Date()); // Trigger image load with cache buster
    }
}


