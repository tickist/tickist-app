import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';


@Component({
    selector: 'delete-project-confirmation-dialog',
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
