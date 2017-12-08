import {MatDialogRef} from "@angular/material";
import {Component} from "@angular/core";


@Component({
  selector: 'app-delete-task',
  templateUrl: './delete-task-dialog.html',
})
export class DeleteTaskDialog {
  constructor(public dialogRef: MatDialogRef< DeleteTaskDialog>) {}

  close(result) {
    this.dialogRef.close(result);
  }
}
