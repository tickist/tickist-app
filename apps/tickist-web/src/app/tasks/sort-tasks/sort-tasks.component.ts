import { Component } from "@angular/core";
import { MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig } from "@angular/material/legacy-dialog";
import { SortByDialogComponent } from "../sort-tasks-dialog/sort-tasks.dialog.component";

@Component({
    selector: "tickist-sort-tasks",
    templateUrl: "./sort-tasks.component.html",
    styleUrls: ["./sort-tasks.component.scss"],
})
export class SortTasksComponent {
    constructor(public dialog: MatDialog) {}

    openSortByDialog() {
        const dialogRef = this.dialog.open(SortByDialogComponent, <
            MatDialogConfig
        >{ height: "360px", width: "305px" });
    }
}
