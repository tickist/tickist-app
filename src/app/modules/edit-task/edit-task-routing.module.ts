import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TaskComponent} from './components/task-component/task.component';



const routes: Routes = [
    {
        path: '',
        component: TaskComponent,

    },
    {
        path: ':taskId',
        component: TaskComponent,
        // outlet: 'content'
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistEditTaskRoutingModule {}
