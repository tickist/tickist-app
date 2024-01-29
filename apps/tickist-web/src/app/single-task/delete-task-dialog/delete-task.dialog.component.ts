import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import {Component} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';


@Component({
    selector: 'tickist-delete-task',
    templateUrl: './delete-task-dialog.component.html',
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
    ],
})
export class DeleteTaskDialogComponent {
    constructor(public dialogRef: MatDialogRef<DeleteTaskDialogComponent>) {
    }

    close(result) {
        this.dialogRef.close(result);
    }
}
