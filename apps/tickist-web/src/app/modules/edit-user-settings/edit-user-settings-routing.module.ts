import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {UserComponent} from './components/user/user.component';
import {TasksTreeViewComponent} from '../tasks-tree-view/pages/tasks-tree-view/tasks-tree-view.component';



const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                outlet: 'content',
                component: UserComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistEditUserSettingsRoutingModule {}
