import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { routes} from './app.routes';
import {FutureTasksFiltersService} from '../services/future-tasks-filters.service';
import {RouterModule} from '@angular/router';
import {LoggedInGuard} from './guards/loggedIn.guard';
import {AnonymousGuard} from './guards/anonymous.guard';
import {TasksResolver} from './resolvers/tasks.resolver';
import {TeamResolver} from './resolvers/team.resolver';
import {ProjectsResolver} from './resolvers/project.resolver';
import {TagsResolver} from './resolvers/tags.resolver';
import {SetAllTasksFilterResolver} from './resolvers/set-all-tasks-filter.resolver';
import {RouterStateSerializer, StoreRouterConnectingModule} from '@ngrx/router-store';
import {CustomSerializer} from './custom-serializer';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forRoot(routes),
        StoreRouterConnectingModule.forRoot({stateKey: 'router'})
    ],
    declarations: [],
    providers: [
        TasksResolver,
        TeamResolver,
        TagsResolver,
        ProjectsResolver,
        SetAllTasksFilterResolver,
        FutureTasksFiltersService,
        LoggedInGuard,
        AnonymousGuard,
        { provide: RouterStateSerializer, useClass: CustomSerializer }
        ],
    exports: [
        RouterModule
    ]
})
export class TickistRoutingModule { }
