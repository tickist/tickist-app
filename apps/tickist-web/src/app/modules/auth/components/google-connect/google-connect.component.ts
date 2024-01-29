import { Component } from "@angular/core";
import { AuthService } from "../../services/auth.service";
import { Router } from "@angular/router";
import { NGXLogger } from "ngx-logger";
import { OperationType } from "@firebase/auth";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: "tickist-google-connect",
    templateUrl: "./google-connect.component.html",
    styleUrls: ["./google-connect.component.scss"],
    standalone: true,
    imports: [MatButtonModule, FaIconComponent],
})
export class GoogleConnectComponent {
    constructor(
        private authService: AuthService,
        private router: Router,
        private logger: NGXLogger,
    ) {}

    googleAuth(): void {
        this.authService.googleAuth().then((userCredential) => {
            this.logger.debug({ userCredential });
            if (userCredential.operationType === OperationType.SIGN_IN) {
                this.authService.save(userCredential.user.uid, userCredential.user.displayName, userCredential.user.email, {
                    avatarUrl: userCredential.user.providerData[0].photoURL,
                    isGoogleConnection: true,
                });
            } else {
                this.router.navigateByUrl("/");
            }
        });
    }
}
