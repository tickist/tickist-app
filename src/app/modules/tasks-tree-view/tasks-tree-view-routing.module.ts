import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TasksTreeViewComponent} from './pages/tasks-tree-view/tasks-tree-view.component';

const routes: Routes = [
    {
        path: '',
        component: TasksTreeViewComponent,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistTasksTreeViewRoutingModule {
}
