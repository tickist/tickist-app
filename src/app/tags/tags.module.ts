import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TagComponent} from './tag/tag.component';
import {TagsComponent} from './tags-component/tags.component';
import {FilterTagsDialogComponent} from './filter-tags-dialog/filter-tags-dialog.component';
import {TagsListComponent} from './tags-list/tags-list.component';
import {TickistMaterialModule} from '../material.module';
import {TickistSharedModule} from '../shared/shared.module';
import {TickistTasksModule} from '../tasks/tasks.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TickistSingleTaskModule} from '../single-task/single-task.module';
import {FlexLayoutModule} from '@angular/flex-layout';


@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        TickistSharedModule,
        TickistSingleTaskModule,
        TickistTasksModule,
        FlexLayoutModule,
        FormsModule,
        ReactiveFormsModule
    ],
    declarations: [TagsComponent, TagComponent, FilterTagsDialogComponent, TagsListComponent],
    providers: [],
    entryComponents: [FilterTagsDialogComponent
    ],
    exports: [
        TagsComponent
    ]
})
export class TickistTagsModule { }
