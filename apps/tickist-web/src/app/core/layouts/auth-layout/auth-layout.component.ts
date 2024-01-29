import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { NavBarAuthPageComponent } from "../../header/nav-bar-auth-page/nav-bar-auth-page.component";

@Component({
    selector: "tickist-dialog-layout",
    templateUrl: "./auth-layout.component.html",
    styleUrls: ["./auth-layout.component.scss"],
    standalone: true,
    imports: [NavBarAuthPageComponent, RouterOutlet],
})
export class AuthLayoutComponent {
    constructor() {}
}
