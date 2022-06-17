import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { UserService } from "../../../../core/services/user.service";
import { NGXLogger } from "ngx-logger";

@Component({
    selector: "tickist-request-reset-password",
    templateUrl: "./request-reset-password.component.html",
    styleUrls: ["./request-reset-password.component.scss"],
})
export class RequestResetPasswordComponent implements OnInit {
    requestChangePasswordForm: FormGroup;
    requestChangePasswordMessage: string;

    constructor(private userService: UserService, private logger: NGXLogger) {}

    ngOnInit() {
        this.requestChangePasswordForm = new FormGroup({
            email: new FormControl(
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
