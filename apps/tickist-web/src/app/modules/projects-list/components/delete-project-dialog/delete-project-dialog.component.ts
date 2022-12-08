import {Component} from '@angular/core';
import {MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';


@Component({
    selector: 'tickist-delete-project-confirmation-dialog',
    templateUrl: './delete-project-dialog.component.html',
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
