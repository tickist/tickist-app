import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ChartsModule} from 'ng2-charts';
import {TickistSharedModule} from '../../../../shared/shared.module';
import {TickistMaterialModule} from '../../../../material.module';
import {ProjectsListComponent} from './pages/projects-list/projects-list.component';
import {DeleteProjectConfirmationDialogComponent} from './components/delete-project-dialog/delete-project-dialog.component';
import {FilterProjectDialogComponent} from './components/filter-projects-dialog/filter-projects.dialog.component';
import {SingleProjectComponent} from './components/single-project/single-project.component';
import {RouterModule} from '@angular/router';
import {FlexLayoutModule} from '@angular/flex-layout';
import { EffectsModule } from '@ngrx/effects';
import { ProjectsFiltersEffects } from './projects-filters.effects';
import {StoreModule} from '@ngrx/store';
import * as fromProjectsFilters from './projects-filters.reducers';


@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        ChartsModule,
        TickistSharedModule,
        RouterModule,
        FlexLayoutModule,
        StoreModule.forFeature('projectsFilters', fromProjectsFilters.reducer),
        EffectsModule.forFeature([ProjectsFiltersEffects])
    ],
    providers: [],
    entryComponents: [DeleteProjectConfirmationDialogComponent, FilterProjectDialogComponent],
    exports: [ProjectsListComponent],
    declarations:
        [ProjectsListComponent, SingleProjectComponent, FilterProjectDialogComponent, DeleteProjectConfirmationDialogComponent]
})

export class TickistProjectListModule {
}
