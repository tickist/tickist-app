import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TagsComponent} from './pages/tags-component/tags.component';
import {TasksFromProjectsComponent} from '../tasks-projects-view/pages/tasks-from-projects/tasks-from-projects.component';
import {BlankComponent} from '../../testing/test.modules';



const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        children: [
            {
                path: '',
                outlet: 'content',
                component: TagsComponent
            },
            // Blank component is here bacause angular has a bug: https://github.com/angular/angular/issues/20694#issuecomment-595707956
            {
                path: '',
                component: BlankComponent
            }
        ],
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TickistTasksTagsViewRoutingModule {}
