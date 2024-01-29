import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TickistMaterialModule } from "../../material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { ColorPickerComponent } from "./components/color-picker/color-picker.component";
import { ProjectComponent } from "./pages/project-component/project.component";
import { TickistSharedModule } from "../../shared/shared.module";
import { TickistEditProjectRoutingModule } from "./edit-project-routing.module";
import { DeleteUserConfirmationDialogComponent } from "./components/delete-user-confirmation-dialog/delete-user-confirmation-dialog.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IconPickerComponent } from "./components/icon-picker/icon-picker.component";
import { FilterPipe } from "./pipes/filter.pipe";
import { A11yModule } from "@angular/cdk/a11y";

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistSharedModule,
        TickistEditProjectRoutingModule,
        FontAwesomeModule,
        A11yModule,
        ColorPickerComponent, ProjectComponent, DeleteUserConfirmationDialogComponent, IconPickerComponent, FilterPipe,
    ],
    providers: [],
    exports: [ProjectComponent],
})
export class TickistEditProjectModule {}
