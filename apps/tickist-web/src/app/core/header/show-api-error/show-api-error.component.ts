import {Component, OnDestroy, OnInit} from '@angular/core';
import {ConfigurationService} from '../../services/configuration.service';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {AppStore} from '../../../store';
import {Store} from '@ngrx/store';
import {selectApiErrorBarIsVisible} from '../../../reducers/core.selectors';

@Component({
    selector: 'tickist-show-api-error',
    templateUrl: './show-api-error.component.html',
    styleUrls: ['./show-api-error.component.scss']
})
export class ShowApiErrorComponent implements OnInit, OnDestroy {
    isVisible$: Observable<boolean>;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private store: Store) {
    }

    ngOnInit() {
        this.isVisible$ = this.store.select(selectApiErrorBarIsVisible);
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}

