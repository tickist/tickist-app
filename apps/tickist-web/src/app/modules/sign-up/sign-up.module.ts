import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { TickistMaterialModule } from "../../material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { TickistSharedModule } from "../../shared/shared.module";
import { IconsModule } from "../../icons.module";
import { TickistSignUpRoutingModule } from "./sign-up-routing.module";
import { SignUpComponent } from "./pages/sign-up/sign-up.component";
import {} from "../auth/components/prompt-user-for-password-dialog/prompt-user-for-password-dialog.component";
import { AuthModule } from "../auth/auth.module";
import { TickistCoreModule } from "../../core/core.module";

@NgModule({
    imports: [
        CommonModule,
        TickistMaterialModule,
        FormsModule,
        FlexLayoutModule,
        ReactiveFormsModule,
        TickistSignUpRoutingModule,
        TickistSharedModule,
        IconsModule,
        AuthModule,
        TickistCoreModule,
        SignUpComponent,
    ],
    providers: [],
    exports: [SignUpComponent],
})
export class TickistSignUpModule {}
