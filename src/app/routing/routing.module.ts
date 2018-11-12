import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProjectsResolver, routes, SetAllTasksFilterResolver, TagsResolver, TasksResolver, TeamResolver, UserResolver} from '../app.routes';
import {FutureTasksFiltersService} from '../services/future-tasks-filters-service';
import {RouterModule} from '@angular/router';
import {LoggedInGuard} from './guards/loggedIn.guard';
import {AnonymousGuard} from './guards/anonymous.guard';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forRoot(routes),
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
