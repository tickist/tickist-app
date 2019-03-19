import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DashboardComponent} from './pages/dashboard/dashboard.component';


const routes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        
    },
    {
        path: ':date',
        component: DashboardComponent,
        //outlet: 'content'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistDashboardRoutingModule {}