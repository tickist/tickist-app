import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TasksTreeViewComponent} from './pages/tasks-tree-view/tasks-tree-view.component';
import {FutureTasksComponent} from '../future-tasks/pages/future-tasks/future-tasks.component';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                outlet: 'content',
                component: TasksTreeViewComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistTasksTreeViewRoutingModule {
}
