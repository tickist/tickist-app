import { TickistSharedModule } from "../../shared/shared.module";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TickistMaterialModule } from "../../material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TagComponent } from "./components/tag/tag.component";
import { FilterTagsDialogComponent } from "./components/filter-tags-dialog/filter-tags-dialog.component";
import { TagsListComponent } from "./pages/tags-list/tags-list.component";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { EffectsModule } from "@ngrx/effects";
import { TagsFiltersEffects } from "./tags-filters.effects";
import { StoreModule } from "@ngrx/store";
import * as fromTagsFilters from "./tags-filters.reducers";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        ReactiveFormsModule,
        TickistSharedModule,
        FlexLayoutModule,
        FontAwesomeModule,
        StoreModule.forFeature("tagsFilters", fromTagsFilters.reducer),
        EffectsModule.forFeature([TagsFiltersEffects]),
    ],
    providers: [],
    exports: [TagsListComponent],
    declarations: [TagComponent, FilterTagsDialogComponent, TagsListComponent],
})
export class TickistTagsListModule {}
