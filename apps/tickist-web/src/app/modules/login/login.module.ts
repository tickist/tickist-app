import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TickistMaterialModule } from "../../material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { TickistSharedModule } from "../../shared/shared.module";
import { LoginComponent } from "./pages/login";
import { TickistLoginRoutingModule } from "./login-routing.module";
import { IconsModule } from "../../icons.module";
import { AuthModule } from "../auth/auth.module";
import { TickistCoreModule } from "../../core/core.module";

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistLoginRoutingModule,
        TickistSharedModule,
        IconsModule,
        AuthModule,
        TickistCoreModule,
        LoginComponent,
    ],
    providers: [],
    exports: [LoginComponent],
})
export class TickistLoginModule {}
