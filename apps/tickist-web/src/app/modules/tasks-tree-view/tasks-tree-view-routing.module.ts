import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TasksTreeViewComponent} from './pages/tasks-tree-view/tasks-tree-view.component';
import {BlankComponent} from "../../shared/components/blank/blank.component";

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                outlet: 'content',
                component: TasksTreeViewComponent
            },
            // Blank component is here bacause angular has a bug: https://github.com/angular/angular/issues/20694#issuecomment-595707956
            {
                path: '',
                component: BlankComponent
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
