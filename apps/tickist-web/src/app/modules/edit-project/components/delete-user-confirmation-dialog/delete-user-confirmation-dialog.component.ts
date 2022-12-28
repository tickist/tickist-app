import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: "tickist-delete-user-confirmation-dialog",
    templateUrl: "./delete-user-confirmation-dialog.component.html",
    styleUrls: ["./delete-user-confirmation-dialog.component.scss"],
})
export class DeleteUserConfirmationDialogComponent {
    title: string;
    content: string;

    constructor(
        public dialogRef: MatDialogRef<DeleteUserConfirmationDialogComponent>
    ) {}

    setTitle(title: string) {
        this.title = title;
    }

    setContent(content: string) {
        this.content = content;
    }
}
