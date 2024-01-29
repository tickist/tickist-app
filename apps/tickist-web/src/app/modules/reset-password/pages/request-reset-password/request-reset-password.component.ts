import { Component, OnInit } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { UserService } from "../../../../core/services/user.service";
import { NGXLogger } from "ngx-logger";
import { MatButtonModule } from "@angular/material/button";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgIf, NgClass } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { FlexModule } from "@ngbracket/ngx-layout/flex";

@Component({
    selector: "tickist-request-reset-password",
    templateUrl: "./request-reset-password.component.html",
    styleUrls: ["./request-reset-password.component.scss"],
    standalone: true,
    imports: [
        FlexModule,
        MatCardModule,
        NgIf,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        NgClass,
        ExtendedModule,
        MatButtonModule,
    ],
})
export class RequestResetPasswordComponent implements OnInit {
    requestChangePasswordForm: UntypedFormGroup;
    requestChangePasswordMessage: string;

    constructor(private userService: UserService, private logger: NGXLogger) {}

    ngOnInit() {
        this.requestChangePasswordForm = new UntypedFormGroup({
            email: new UntypedFormControl(
                "",
                Validators.compose([Validators.required, Validators.email])
            ),
        });
    }

    async requestChangePassword($event, values: any): Promise<void> {
        try {
            const result = await this.userService.requestChangePassword(
                values.email
            );
            this.logger.debug({ result });
            this.requestChangePasswordMessage = "Please check your inbox.";
        } catch (e) {
            this.logger.error({ e });
            this.requestChangePasswordMessage = "Something goes wrong.";
        }
    }
}
