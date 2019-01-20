import {Component, OnDestroy, OnInit} from '@angular/core';
import {ConfigurationService} from '../services/configuration.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'tickist-show-api-error',
    templateUrl: './show-api-error.component.html',
    styleUrls: ['./show-api-error.component.scss']
})
export class ShowApiErrorComponent implements OnInit, OnDestroy {
    isVisible = false;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(protected configurationService: ConfigurationService) {
    }

    ngOnInit() {
        this.configurationService.detectApiError$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(isVisible => {
                this.isVisible = isVisible;
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
