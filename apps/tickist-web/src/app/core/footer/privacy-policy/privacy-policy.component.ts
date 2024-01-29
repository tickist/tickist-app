import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: "tickist-privacy-policy",
    templateUrl: "./privacy-policy.component.html",
    styleUrls: ["./privacy-policy.component.scss"],
    standalone: true,
    imports: [RouterLink],
})
export class PrivacyPolicyComponent {
    constructor() {}
}
