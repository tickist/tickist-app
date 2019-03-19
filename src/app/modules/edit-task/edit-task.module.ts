import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TaskComponent} from './components/task-component/task.component';
import {TickistEditTaskRoutingModule} from './edit-task-routing.module';
import {TickistSharedModule} from '../../shared/shared.module';
import {SortablejsModule} from 'angular-sortablejs';


@NgModule({
    imports: [CommonModule, TickistMaterialModule, FormsModule, FlexLayoutModule,
        ReactiveFormsModule, TickistEditTaskRoutingModule, TickistSharedModule, SortablejsModule],
    providers: [],
    exports: [TaskComponent],
    declarations: [
        TaskComponent
    ]
})
export class TickistEditTaskModule {
}