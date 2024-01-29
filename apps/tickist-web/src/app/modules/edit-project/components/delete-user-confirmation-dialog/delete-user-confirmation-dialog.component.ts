import { Component } from "@angular/core";
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: "tickist-delete-user-confirmation-dialog",
    templateUrl: "./delete-user-confirmation-dialog.component.html",
    styleUrls: ["./delete-user-confirmation-dialog.component.scss"],
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
    ],
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
