import {Component} from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from "@angular/material/dialog";
import { MatButtonModule } from '@angular/material/button';


@Component({
    selector: 'tickist-delete-project-confirmation-dialog',
    templateUrl: './delete-project-dialog.component.html',
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
    ],
})
export class DeleteProjectConfirmationDialogComponent {
    title: string;
    content: string;

    constructor(public dialogRef: MatDialogRef<DeleteProjectConfirmationDialogComponent>) {
    }

    setTitle(title: string) {
        this.title = title;
    }

    setContent(content: string) {
        this.content = content;
    }
}
