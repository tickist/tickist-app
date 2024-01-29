import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TickistMaterialModule } from "../../material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { TickistSharedModule } from "../../shared/shared.module";
import { ResetPasswordComponent } from "./pages/reset-password";
import { TickistResetPasswordRoutingModule } from "./reset-password-routing.module";
import { RequestResetPasswordComponent } from "./pages/request-reset-password/request-reset-password.component";
import { TickistCoreModule } from "../../core/core.module";

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistResetPasswordRoutingModule,
        TickistSharedModule,
        TickistCoreModule,
        ResetPasswordComponent, RequestResetPasswordComponent,
    ],
    providers: [],
    exports: [ResetPasswordComponent, RequestResetPasswordComponent],
})
export class TickistResetPasswordModule {}
