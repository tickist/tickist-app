import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../material.module';
import {TickistSharedModule} from '../shared/shared.module';
import {TickistTasksModule} from '../tasks/tasks.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TickistSingleTaskModule} from '../single-task/single-task.module';
import {ColorPickerComponent} from './color-picker/color-picker.component';
import {DeleteProjectConfirmationDialogComponent} from './delete-project-dialog/delete-project-dialog.component';
import {FilterProjectDialogComponent} from './filter-projects-dialog/filter-projects.dialog.component';
import {ProjectComponent} from './project-component/project.component';
import {ProjectsListComponent} from './projects-list/projects-list.component';
import {SingleProjectComponent} from './single-project/single-project.component';
import {TasksFromProjectsComponent} from '../tasks-from-projects/tasks-from-projects.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {RouterModule} from '@angular/router';


@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        TickistSharedModule,
        TickistSingleTaskModule,
        TickistTasksModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        RouterModule
    ],
    declarations: [ColorPickerComponent, DeleteProjectConfirmationDialogComponent, FilterProjectDialogComponent, ProjectComponent,
        ProjectsListComponent, SingleProjectComponent, TasksFromProjectsComponent],
    providers: [],
    entryComponents: [DeleteProjectConfirmationDialogComponent, FilterProjectDialogComponent],
    exports: [
        TasksFromProjectsComponent
    ]
})
export class TickistProjectsModule { }
