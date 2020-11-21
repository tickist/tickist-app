import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistMaterialModule} from '../../material.module';
import {TickistSingleTaskModule} from '../../single-task/single-task.module';
import {TickistSharedModule} from '../../shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TickistTasksModule} from '../../tasks/tasks.module';
import {TasksTreeViewComponent} from './pages/tasks-tree-view/tasks-tree-view.component';
import {ProjectTreeComponent} from './components/project-tree/project-tree.component';
import {RouterModule} from '@angular/router';
import {FlexLayoutModule} from '@angular/flex-layout';
import {TickistTasksTreeViewRoutingModule} from './tasks-tree-view-routing.module';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';


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
        RouterModule,
        TickistTasksTreeViewRoutingModule,
        FontAwesomeModule
    ],
    declarations: [
        TasksTreeViewComponent,
        ProjectTreeComponent,
    ],
    providers: [],
    exports: [
        TasksTreeViewComponent
    ]
})
export class TickistTasksTreeViewModule {
}
