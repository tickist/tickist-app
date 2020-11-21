import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../../material.module';
import {TickistSingleTaskModule} from '../../single-task/single-task.module';
import {TickistSharedModule} from '../../shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TickistTasksModule} from '../../tasks/tasks.module';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TagsComponent} from './pages/tags-component/tags.component';
import {TickistTasksTagsViewRoutingModule} from './tasks-tags-view-routing.module';



@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        TickistSingleTaskModule,
        TickistSharedModule,
        TickistTasksModule,
        FlexLayoutModule,
        FormsModule,
        ReactiveFormsModule,
        TickistTasksTagsViewRoutingModule
    ],
    declarations: [TagsComponent],
    providers: [
    ],
    exports: [
        TagsComponent
    ]
})
export class TickistTasksTagsViewModule { }
