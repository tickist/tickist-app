import {MatDialogRef} from '@angular/material';
import {Component} from '@angular/core';


@Component({
  selector: 'app-delete-task',
  templateUrl: './delete-task-dialog.component.html',
})
export class DeleteTaskDialogComponent {
  constructor(public dialogRef: MatDialogRef<DeleteTaskDialogComponent>) {}

  close(result) {
    this.dialogRef.close(result);
  }
}
