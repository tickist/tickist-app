import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ConfigurationService} from '../../services/configurationService';
import {IActiveDateElement} from '../../models/active-data-element.interface';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {stateActiveDateElement} from '../../models/state-active-date-element.enum';

@Component({
    selector: 'tickst-days-weeks-year-list',
    templateUrl: './days-weeks-year-list.component.html',
    styleUrls: ['./days-weeks-year-list.component.scss']
})
export class DaysWeeksYearListComponent implements OnInit, OnDestroy {
    activeDateElement: IActiveDateElement;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    stateActiveDateElement = stateActiveDateElement;

    constructor(private configurationService: ConfigurationService, private cd: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.configurationService.activeDateElement$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((activeDateElement: IActiveDateElement) => {
                this.activeDateElement = activeDateElement;
                this.cd.detectChanges();
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
