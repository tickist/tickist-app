import {Directive, EmbeddedViewRef, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectLoggedInUser} from '../../core/selectors/user.selectors';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {User} from '@data/users/models';

@Directive({
    selector: '[tickistFeatureFlag], [featureFlag]',
    standalone: true
})
export class FeatureFlagDirective implements OnInit, OnDestroy {
    @Input() featureFlag: string;
    private ngUnsubscribe: Subject<void> = new Subject<void>();
    private embededViewRef: EmbeddedViewRef<any>;

    constructor(
        private vcr: ViewContainerRef,
        private tpl: TemplateRef<any>,
        private store: Store
    ) {
    }

    ngOnInit() {
        this.store.select(selectLoggedInUser)
            .pipe(
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((user: User) => {
                if (user && user.flags[this.featureFlag] && !this.embededViewRef) {
                    this.embededViewRef = this.vcr.createEmbeddedView(this.tpl);
                }
            });
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
