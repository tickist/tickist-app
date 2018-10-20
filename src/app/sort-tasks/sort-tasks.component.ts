import {Component, OnInit, Input} from '@angular/core';
import {TaskService} from '../services/task-service';
import {TagService} from '../services/tag-service';
import {MatDialog} from '@angular/material';
import {SortByDialog} from './sort-tasks-dialog/sort-tasks.dialog.component';
import {TasksFiltersService} from "../services/tasks-filters.service";

@Component({
  selector: 'tickist-sort-tasks',
  templateUrl: './sort-tasks.component.html',
  styleUrls: ['./sort-tasks.component.scss']
})
export class SortTasksComponent implements OnInit {
  sortByValue: any = {};
    
  constructor(public dialog: MatDialog, private tasksFiltersService: TasksFiltersService) {
  }


  openSortByDialog() {
    const dialogRef = this.dialog.open(SortByDialog);
    dialogRef.afterClosed().subscribe(result => {
      console.log('aaa');
    });
  }



  ngOnInit() {
    this.tasksFiltersService.currentTasksFilters$.subscribe((filters) => {
      if (filters.length > 0) {
        this.sortByValue = filters.filter(filter => filter.label === 'sorting')[0];
      }
    });
  }



}