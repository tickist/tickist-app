import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TasksFromProjectsComponent} from './pages/tasks-from-projects/tasks-from-projects.component';



const routes: Routes = [
    {
        path: '',
        component: TasksFromProjectsComponent,
    },
    {
        path: ':projectId',
        component: TasksFromProjectsComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistTasksProjectsViewRoutingModule {}
