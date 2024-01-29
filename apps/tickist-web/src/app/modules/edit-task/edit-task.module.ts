import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TickistMaterialModule } from "../../material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { TaskComponent } from "./pages/task-component/task.component";
import { TickistEditTaskRoutingModule } from "./edit-task-routing.module";
import { TickistSharedModule } from "../../shared/shared.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { A11yModule } from "@angular/cdk/a11y";
import { DragDropModule } from "@angular/cdk/drag-drop";

@NgModule({
    imports: [
        CommonModule,
        FontAwesomeModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistEditTaskRoutingModule,
        TickistSharedModule,
        DragDropModule,
        A11yModule,
        TaskComponent,
    ],
    providers: [],
    exports: [TaskComponent],
})
export class TickistEditTaskModule {}
