import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import {Component} from '@angular/core';


@Component({
    selector: 'tickist-delete-task',
    templateUrl: './delete-task-dialog.component.html',
})
export class DeleteTaskDialogComponent {
    constructor(public dialogRef: MatDialogRef<DeleteTaskDialogComponent>) {
    }

    close(result) {
        this.dialogRef.close(result);
    }
}
