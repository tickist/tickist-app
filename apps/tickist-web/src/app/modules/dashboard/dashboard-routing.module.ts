import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {futureTasksRoutesName} from '../future-tasks/routes.names';
import {LoggedInGuard} from '../../core/guards/loggedIn.guard';
import {BlankComponent} from '../../testing/test.modules';


const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        children: [
            {
                path: '',
                outlet: 'content',
                component: DashboardComponent
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
                component: DashboardComponent
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
export class TickistDashboardRoutingModule {}
