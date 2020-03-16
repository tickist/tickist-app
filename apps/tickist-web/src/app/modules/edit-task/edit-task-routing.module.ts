import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TaskComponent} from './pages/task-component/task.component';
import {BlankComponent} from '../../testing/test.modules';



const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        children: [
            {
                path: '',
                outlet: 'content',
                component: TaskComponent
            },
            // Blank component is here bacause angular has a bug: https://github.com/angular/angular/issues/20694#issuecomment-595707956
            {
                path: '',
                component: BlankComponent
            }
        ],
    },
    {
        path: ':taskId',
        children: [
            {
                path: '',
                outlet: 'content',
                component: TaskComponent
            }, {
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
export class TickistEditTaskRoutingModule {}
