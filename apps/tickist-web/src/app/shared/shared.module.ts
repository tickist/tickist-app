import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ChangeTaskViewComponent } from "./components/change-task-view-component/change-task-view.component";
import { TickistMaterialModule } from "../material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ConfigurationService } from "../core/services/configuration.service";
import { MenuButtonComponent } from "./components/menu-button/menu-button.component";
import { AvatarSize } from "./pipes/avatarSize";
import { PriorityComponent } from "./components/priority/priority.component";
import { TruncatePipe } from "./pipes/truncate.pipe";
import { Minutes2hoursPipe } from "./pipes/minutes2hours";
import { DateToString } from "./pipes/datetostring";
import { RepeatString } from "./pipes/repeatString";
import { RepeatStringExtension } from "./pipes/repeatStringExtension";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { UserAvatarComponent } from "./components/user-avatar/user-avatar.component";
import { FeatureFlagDirective } from "./directives/feature-flag.directive";
import { BlankComponent } from "./components/blank/blank.component";
import { EnumToArrayPipe } from "./pipes/enum-to-array";
import { DataCyDirective } from "./directives/data-cy.directive";
import { AddTaskComponent } from "./components/add-task/add-task.component";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        FontAwesomeModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        ChangeTaskViewComponent,
        MenuButtonComponent,
        AvatarSize,
        PriorityComponent,
        TruncatePipe,
        Minutes2hoursPipe,
        DateToString,
        RepeatString,
        RepeatStringExtension,
        UserAvatarComponent,
        FeatureFlagDirective,
        BlankComponent,
        EnumToArrayPipe,
        DataCyDirective,
        AddTaskComponent,
    ],
    providers: [ConfigurationService],
    exports: [
        ChangeTaskViewComponent,
        MenuButtonComponent,
        AvatarSize,
        PriorityComponent,
        TruncatePipe,
        Minutes2hoursPipe,
        DateToString,
        RepeatString,
        RepeatStringExtension,
        UserAvatarComponent,
        FeatureFlagDirective,
        BlankComponent,
        EnumToArrayPipe,
        DataCyDirective,
        AddTaskComponent,
    ],
})
export class TickistSharedModule {}
