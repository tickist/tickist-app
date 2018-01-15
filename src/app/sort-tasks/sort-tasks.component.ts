import {Component, OnInit, Input} from '@angular/core';
import {TaskService} from '../services/taskService';
import {TagService} from '../services/tagService';
import {MatDialog} from '@angular/material';
import {SortByDialog} from './sort-tasks-dialog/sort-tasks.dialog.component';

@Component({
  selector: 'tickist-sort-tasks',
  templateUrl: './sort-tasks.component.html',
  styleUrls: ['./sort-tasks.component.scss']
})
export class SortTasksComponent implements OnInit {
  sortByValue: any = {};
    
  constructor(public dialog: MatDialog, private taskService: TaskService) {
  }


  openSortByDialog() {
    const dialogRef = this.dialog.open(SortByDialog);
    dialogRef.afterClosed().subscribe(result => {
      console.log('aaa');
    });
  }



  ngOnInit() {
    this.taskService.currentTasksFilters$.subscribe((filters) => {
      if (filters.length > 0) {
        this.sortByValue = filters.filter(filter => filter.label === 'sorting')[0];
      }
    });
  }



}
