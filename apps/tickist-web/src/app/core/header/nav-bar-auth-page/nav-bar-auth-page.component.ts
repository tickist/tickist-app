import { Component } from "@angular/core";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { FlexModule } from "@ngbracket/ngx-layout/flex";
import { MatToolbarModule } from "@angular/material/toolbar";

@Component({
    selector: "tickist-nav-bar-landing-page",
    templateUrl: "./nav-bar-auth-page.component.html",
    styleUrls: ["./nav-bar-auth-page.component.scss"],
    standalone: true,
    imports: [
        MatToolbarModule,
        FlexModule,
        MatButtonModule,
        RouterLink,
        FaIconComponent,
    ],
})
export class NavBarAuthPageComponent {
    constructor() {}
}
