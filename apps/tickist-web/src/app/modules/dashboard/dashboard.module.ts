import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TickistDashboardRoutingModule} from "./dashboard-routing.module";
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProjectWithoutNextActionTasksComponent } from './components/project-without-next-action-tasks/project-without-next-action-tasks.component';
import { NextActionTasksComponent } from './components/next-action-tasks/next-action-tasks.component';
import {TickistTasksModule} from "../../tasks/tasks.module";
import {TickistSingleTaskModule} from "../../single-task/single-task.module";
import {TickistSharedModule} from "../../shared/shared.module";
import {TickistMaterialModule} from "../../material.module";
import {IconsModule} from "../../icons.module";
import { NeedInfoTasksComponent } from './components/need-info-tasks/need-info-tasks.component';
import {TickistProjectListModule} from "../projects-list/projects-list.module";


@NgModule({
    imports: [
        CommonModule,
        TickistDashboardRoutingModule,
        TickistTasksModule,
        TickistSingleTaskModule,
        TickistSharedModule,
        TickistMaterialModule,
        IconsModule,
        TickistProjectListModule,
        DashboardComponent,
        ProjectWithoutNextActionTasksComponent,
        NextActionTasksComponent,
        NeedInfoTasksComponent
    ]
})
export class TickistDashboardModule {
}
