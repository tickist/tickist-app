import {Component, OnInit} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {SortByDialogComponent} from '../sort-tasks-dialog/sort-tasks.dialog.component';


@Component({
    selector: 'tickist-sort-tasks',
    templateUrl: './sort-tasks.component.html',
    styleUrls: ['./sort-tasks.component.scss']
})
export class SortTasksComponent implements OnInit {


    constructor(public dialog: MatDialog) {
    }


    openSortByDialog() {
        const dialogRef = this.dialog.open(SortByDialogComponent, <MatDialogConfig> {'height': '350px', 'width': '300px'});
    }


    ngOnInit() {

    }


}
