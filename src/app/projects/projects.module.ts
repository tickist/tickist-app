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
import { EffectsModule } from '@ngrx/effects';
import { ProjectsEffects } from './projects.effects';
import { StoreModule } from '@ngrx/store';
import * as fromProjects from './projects.reducer';
import * as fromActiveProject from './active-project.reducer';
import * as fromActiveProjectsId from './active-projects-ids.reducer';
import { ActiveProjectsIdsEffects } from './active-projects-ids.effects';
import { ActiveProjectEffects } from './active-project.effects';


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
        RouterModule,
        EffectsModule.forFeature([ProjectsEffects, ActiveProjectsIdsEffects, ActiveProjectEffects]),
        StoreModule.forFeature('projects', fromProjects.reducer),
        StoreModule.forFeature('activeProject', fromActiveProject.reducer),
        StoreModule.forFeature('activeProjectsIds', fromActiveProjectsId.reducer)
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
