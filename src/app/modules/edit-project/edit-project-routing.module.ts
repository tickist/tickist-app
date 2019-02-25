import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ProjectComponent} from './components/project-component/project.component';



const routes: Routes = [
    {
        path: '',
        component: ProjectComponent,

    },
    {
        path: ':projectId',
        component: ProjectComponent,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistEditProjectRoutingModule {}
