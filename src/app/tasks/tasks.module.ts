import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {TickistMaterialModule} from '../material.module';
import {TickistSingleTaskModule} from '../single-task/single-task.module';
import {TickistSharedModule} from '../shared/shared.module';
import {SortTasksComponent} from './sort-tasks/sort-tasks.component';
import {SortByDialogComponent} from './sort-tasks-dialog/sort-tasks.dialog.component';
import {EstimateTimeDialogComponent} from './estimate-time-dialog/estimate-time-dialog.component';
import {AssignedToDialogComponent} from './assigned-to-dialog/assigned-to.dialog.component';
import {FilterTasksComponent} from './filter-tasks/filter-tasks.component';
import {TagsFilterDialogComponent} from './tags-filter-dialog/tags-filter-dialog.component';
import {TasksFilterDialogComponent} from './tasks-filter-dialog/tasks-filter-dialog.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SliderModule} from 'primeng/primeng';
import { NoTasksComponent } from './no-tasks/no-tasks.component';
import { StoreModule } from '@ngrx/store';
import * as fromTask from './task.reducer';
import { EffectsModule } from '@ngrx/effects';
import { TaskEffects } from './task.effects';
import {TaskService} from './task.service';
import * as fromFilterTasks from './main-filters-tasks.reducer';
import * as fromAssignedToFiltersTasks from './assigned-to-filters-tasks.reducer';
import * as fromEstimateTimeFiltersTasks from './estimate-time-filters-tasks.reducer';
import * as fromTagsFiltersTasks from './tags-filters-tasks.reducer';
import { AssignedToFiltersTasksEffects } from './assigned-to-filters-tasks.effects';
import * as fromSearchTasks from './search-tasks.reducer';
import { TasksFiltersEffects } from './tasks-filters.effects';
import * as fromSortTasks from './sort-tasks.reducer';

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        TickistSingleTaskModule,
        TickistSharedModule,
        FormsModule,
        ReactiveFormsModule,
        SliderModule,
        StoreModule.forFeature('task', fromTask.reducer),
        EffectsModule.forFeature([TaskEffects, AssignedToFiltersTasksEffects, TasksFiltersEffects]),
        StoreModule.forFeature('mainFiltersTasks', fromFilterTasks.reducer),
        StoreModule.forFeature('assignedToFiltersTasks', fromAssignedToFiltersTasks.reducer),
        StoreModule.forFeature('estimateTimeFiltersTasks', fromEstimateTimeFiltersTasks.reducer),
        StoreModule.forFeature('tagsFiltersTasks', fromTagsFiltersTasks.reducer),
        StoreModule.forFeature('searchTasks', fromSearchTasks.reducer),
        StoreModule.forFeature('sortTasks', fromSortTasks.reducer)
    ],
    declarations: [SortTasksComponent, SortByDialogComponent, EstimateTimeDialogComponent, AssignedToDialogComponent, FilterTasksComponent,
        TagsFilterDialogComponent, TasksFilterDialogComponent, NoTasksComponent ],
    providers: [
        TaskService
    ],
    entryComponents: [SortByDialogComponent, AssignedToDialogComponent, EstimateTimeDialogComponent, AssignedToDialogComponent,
        TagsFilterDialogComponent, TasksFilterDialogComponent
    ],
    exports: [
        SortTasksComponent, FilterTasksComponent, NoTasksComponent
    ]
})
export class TickistTasksModule { }
