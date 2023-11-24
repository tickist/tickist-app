import { ChangeDetectionStrategy, Component, Input, OnChanges } from "@angular/core";

@Component({
    selector: "tickist-toggle-button",
    templateUrl: "./toggle-button.component.html",
    styleUrls: ["./toggle-button.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleButtonComponent implements OnChanges {
    @Input() isDone: boolean;
    @Input() isOnHold: boolean;
    @Input() priority: string;
    icon: Array<string>;

    constructor() {}

    ngOnChanges() {
        if (this.isDone && !this.isOnHold) {
            this.icon = ["far", "check-square"];
        } else if (!this.isDone && !this.isOnHold) {
            this.icon = ["far", "square"];
        } else if (this.isOnHold) {
            this.icon = ["fas", "pause"];
        }
    }
}
