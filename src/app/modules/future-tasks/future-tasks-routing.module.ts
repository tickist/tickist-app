import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {FutureTasksComponent} from './pages/future-tasks/future-tasks.component';



const routes: Routes = [
    {
        path: '',
        component: FutureTasksComponent

    },
    {
        path: ':date',
        component: FutureTasksComponent
    },

];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistFutureRoutingModule {}
