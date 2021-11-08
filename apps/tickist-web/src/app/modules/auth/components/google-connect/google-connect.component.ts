import { Component } from "@angular/core";
import { AuthService } from "../../services/auth.service";
import { Router } from "@angular/router";
import { AngularFirestore } from "@angular/fire/firestore";
import { NGXLogger } from "ngx-logger";

@Component({
    selector: "tickist-google-connect",
    templateUrl: "./google-connect.component.html",
    styleUrls: ["./google-connect.component.scss"],
})
export class GoogleConnectComponent {
    constructor(
        private authService: AuthService,
        private router: Router,
        private logger: NGXLogger
    ) {}

    googleAuth(): void {
        this.authService.googleAuth().then((user) => {
            this.logger.debug({ user });
            if (user.additionalUserInfo.isNewUser) {
                this.authService.save(
                    user.user.uid,
                    (user.additionalUserInfo.profile as any).name,
                    user.user.email,
                    {
                        avatarUrl: (user.additionalUserInfo.profile as any)
                            .picture,
                        isGoogleConnection: true,
                    }
                );
            } else {
                this.router.navigateByUrl("/");
            }
        });
    }
}
