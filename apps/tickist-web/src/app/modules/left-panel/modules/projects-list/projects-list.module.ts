import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
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
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {DataCyDirective} from "../../../../shared/directives/data-cy.directive";


@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        RouterModule,
        FlexLayoutModule,
        FontAwesomeModule,
        TickistSharedModule,
        StoreModule.forFeature('projectsFilters', fromProjectsFilters.reducer),
        EffectsModule.forFeature([ProjectsFiltersEffects])
    ],
    entryComponents: [DeleteProjectConfirmationDialogComponent, FilterProjectDialogComponent],
    exports: [ProjectsListComponent],
    declarations:
        [ProjectsListComponent, SingleProjectComponent, FilterProjectDialogComponent, DeleteProjectConfirmationDialogComponent]
})

export class TickistProjectListModule {
}
