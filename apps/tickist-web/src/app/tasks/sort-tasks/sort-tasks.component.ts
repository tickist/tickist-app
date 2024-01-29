import { Component } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { SortByDialogComponent } from "../sort-tasks-dialog/sort-tasks.dialog.component";
import { MenuButtonComponent } from "../../shared/components/menu-button/menu-button.component";

@Component({
    selector: "tickist-sort-tasks",
    templateUrl: "./sort-tasks.component.html",
    styleUrls: ["./sort-tasks.component.scss"],
    standalone: true,
    imports: [MenuButtonComponent],
})
export class SortTasksComponent {
    constructor(public dialog: MatDialog) {}

    openSortByDialog() {
        this.dialog.open(SortByDialogComponent, <MatDialogConfig>{ height: "360px", width: "305px" });
    }
}
