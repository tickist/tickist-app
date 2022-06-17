import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnChanges,
    SimpleChange,
} from "@angular/core";
import { IconPrefix } from "@fortawesome/fontawesome-common-types";

@Component({
    selector: "tickist-menu-button",
    templateUrl: "./menu-button.component.html",
    styleUrls: ["./menu-button.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuButtonComponent implements OnChanges {
    @Input() icon: any;
    @Input() iconPrefix: IconPrefix = "fas";
    @Input() color = "white";
    @Input() isDisabled = false;
    @Input() fontSize = "16px";
    @Input() transform = "";
    @Input() rotate = 0;
    isDisabledClass = "";

    constructor() {}

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes?.isDisabled?.currentValue) {
            this.isDisabledClass = "unvisible";
        } else {
            this.isDisabledClass = "visible";
        }
    }
}
