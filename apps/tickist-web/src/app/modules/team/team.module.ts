import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TickistMaterialModule } from "../../material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { TeamComponent } from "./components/team/team.component";
import { TickistTeamRoutingModule } from "./team-routing.module";
import { TickistSharedModule } from "../../shared/shared.module";

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistTeamRoutingModule,
        TickistSharedModule,
        TeamComponent,
    ],
    providers: [],
    exports: [],
})
export class TickistTeamModule {}
