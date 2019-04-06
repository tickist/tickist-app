import {TickistSharedModule} from '../../../../shared/shared.module';
import {CommonModule} from '@angular/common';
import {ChartsModule} from 'ng2-charts';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TagComponent} from './components/tag/tag.component';
import {FilterTagsDialogComponent} from './components/filter-tags-dialog/filter-tags-dialog.component';
import {TagsListComponent} from './pages/tags-list/tags-list.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import { EffectsModule } from '@ngrx/effects';
import { TagsFiltersEffects } from './tags-filters.effects';
import {StoreModule} from '@ngrx/store';
import * as fromTagsFilters from './tags-filters.reducers';


@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        ReactiveFormsModule,
        ChartsModule,
        TickistSharedModule,
        FlexLayoutModule,
        StoreModule.forFeature('tagsFilters', fromTagsFilters.reducer),
        EffectsModule.forFeature([TagsFiltersEffects])
    ],
    providers: [],
    entryComponents: [
        FilterTagsDialogComponent
    ],
    exports:
        [TagsListComponent],
    declarations:
        [TagComponent, FilterTagsDialogComponent, TagsListComponent]
})

export class TickistTagsListModule {
}
