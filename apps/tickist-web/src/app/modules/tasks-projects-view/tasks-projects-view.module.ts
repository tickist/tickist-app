import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TickistMaterialModule } from "../../material.module";
import { TickistSingleTaskModule } from "../../single-task/single-task.module";
import { TickistSharedModule } from "../../shared/shared.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TickistTasksModule } from "../../tasks/tasks.module";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { TasksFromProjectsComponent } from "./pages/tasks-from-projects/tasks-from-projects.component";
import { TickistTasksProjectsViewRoutingModule } from "./tasks-projects-view-routing.module";
import { IconsModule } from "../../icons.module";

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        TickistSingleTaskModule,
        TickistSharedModule,
        TickistTasksModule,
        FlexLayoutModule,
        FormsModule,
        ReactiveFormsModule,
        TickistTasksProjectsViewRoutingModule,
        IconsModule,
    ],
    declarations: [TasksFromProjectsComponent],
    exports: [],
})
export class TickistTasksProjectsViewModule {}
