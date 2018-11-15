import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { routes} from '../app.routes';
import {FutureTasksFiltersService} from '../services/future-tasks-filters-service';
import {RouterModule} from '@angular/router';
import {LoggedInGuard} from './guards/loggedIn.guard';
import {AnonymousGuard} from './guards/anonymous.guard';
import {TasksResolver} from './resolvers/tasks.resolver';
import {TeamResolver} from './resolvers/team.resolver';
import {ProjectsResolver} from './resolvers/project.resolver';
import {TagsResolver} from './resolvers/tags.resolver';
import {UserResolver} from './resolvers/user.resolver';
import {SetAllTasksFilterResolver} from './resolvers/set-all-tasks-filter.resolver';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forRoot(routes)
    ],
    declarations: [],
    providers: [
        TasksResolver,
        TeamResolver,
        UserResolver,
        TagsResolver,
        ProjectsResolver,
        SetAllTasksFilterResolver,
        FutureTasksFiltersService,
        LoggedInGuard,
        AnonymousGuard,
        ],
    exports: [
        RouterModule
    ]
})
export class TickistRoutingModule { }
