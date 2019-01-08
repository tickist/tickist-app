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

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        TickistSingleTaskModule,
        TickistSharedModule,
        FormsModule,
        ReactiveFormsModule,
        SliderModule
    ],
    declarations: [SortTasksComponent, SortByDialogComponent, EstimateTimeDialogComponent, AssignedToDialogComponent, FilterTasksComponent,
        TagsFilterDialogComponent, TasksFilterDialogComponent, NoTasksComponent ],
    providers: [

    ],
    entryComponents: [SortByDialogComponent, AssignedToDialogComponent, EstimateTimeDialogComponent, AssignedToDialogComponent,
        TagsFilterDialogComponent, TasksFilterDialogComponent
    ],
    exports: [
        SortTasksComponent, FilterTasksComponent, NoTasksComponent
    ]
})
export class TickistTasksModule { }
