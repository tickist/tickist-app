import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule} from '@angular/forms';
import {TickistSharedModule} from '../../shared/shared.module';
import {TickistFutureRoutingModule} from './future-tasks-routing.module';
import {FutureTasksComponent} from './pages/future-tasks/future-tasks.component';
import {TickistSingleTaskModule} from '../../single-task/single-task.module';
import {FilterFutureTasksComponent} from './components/filter-future-tasks/filter-future-tasks.component';
import { EffectsModule } from '@ngrx/effects';
import { FutureTasksEffects } from './core/effects/future-tasks.effects';
import {StoreModule} from '@ngrx/store';
import * as fromFutureTasks from './core/reducers/future-tasks-filters.reducers';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';



@NgModule({
    imports: [
        TickistFutureRoutingModule,
        CommonModule,
        TickistMaterialModule,
        TickistSingleTaskModule,
        FormsModule,
        TickistSharedModule,
        FontAwesomeModule,
        StoreModule.forFeature('futureTasks', fromFutureTasks.reducer),
        EffectsModule.forFeature([FutureTasksEffects]),
        FutureTasksComponent, FilterFutureTasksComponent,
    ],
    providers: [],
    exports: [FutureTasksComponent]
})

export class TickistFutureTasksModule {
}
