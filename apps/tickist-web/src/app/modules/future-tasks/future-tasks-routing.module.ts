import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {FutureTasksComponent} from './pages/future-tasks/future-tasks.component';
import {DashboardComponent} from '../dashboard';
import {BlankComponent} from '../../testing/test.modules';



const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        children: [
            {
                path: '',
                outlet: 'content',
                component: FutureTasksComponent
            },
            // Blank component is here bacause angular has a bug: https://github.com/angular/angular/issues/20694#issuecomment-595707956
            {
                path: '',
                component: BlankComponent
            }
        ],
    },
    {
        path: ':date',
        children: [
            {
                path: '',
                outlet: 'content',
                component: FutureTasksComponent
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
export class TickistFutureRoutingModule {}
