import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TaskComponent} from './pages/task-component/task.component';
import {TickistEditTaskRoutingModule} from './edit-task-routing.module';
import {TickistSharedModule} from '../../shared/shared.module';
import {SortablejsModule} from 'ngx-sortablejs';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {A11yModule} from "@angular/cdk/a11y";


@NgModule({
    imports: [
        CommonModule,
        FontAwesomeModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistEditTaskRoutingModule,
        TickistSharedModule,
        SortablejsModule.forRoot({
            animation: 150
        }),
        A11yModule
    ],
    providers: [],
    exports: [TaskComponent],
    declarations: [
        TaskComponent
    ]
})
export class TickistEditTaskModule {
}
