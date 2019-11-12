import {Component, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';

@Component({
    selector: 'tickist-delete-user-confirmation-dialog',
    templateUrl: './delete-user-confirmation-dialog.component.html',
    styleUrls: ['./delete-user-confirmation-dialog.component.scss']
})
export class DeleteUserConfirmationDialogComponent implements OnInit {
    title: string;
    content: string;

    constructor(public dialogRef: MatDialogRef<DeleteUserConfirmationDialogComponent>) {
    }

    ngOnInit() {
    }

    setTitle(title: string) {
        this.title = title;
    }

    setContent(content: string) {
        this.content = content;
    }

}
