import {Component, OnInit, Input} from '@angular/core';
import {TieredMenuModule, MenuItem} from 'primeng/primeng';
import {TaskService} from '../services/taskService';
import {TagService} from '../services/tagService';
import {Tag} from '../models/tags';
import {MatDialogRef, MatDialog} from '@angular/material';

@Component({
  selector: 'app-filter-tasks',
  templateUrl: './filter-tasks.component.html',
  styleUrls: ['./filter-tasks.component.scss']
})
export class FilterTasksComponent implements OnInit {
  @Input() showTags: boolean;
  filterValue: any = {};
  assignedToValue: any = {};
  estimateTime__ltValue: any = {};
  estimateTime__gtValue: any = {};
  tagsFilterValue: any = {};

  constructor(public dialog: MatDialog, private taskService: TaskService, private tagService: TagService) {
  }

  openTasksFilterDialog() {
    const dialogRef = this.dialog.open(TasksFilterDialog);
    dialogRef.afterClosed().subscribe(result => {
      console.log("aaa")
    });
  }

  openAssignedToDialog() {
    const dialogRef = this.dialog.open(AssignedToDialog, {
        height: '400px',
        width: '300px',
      });
    dialogRef.afterClosed().subscribe(result => {
      console.log("aaa")
    });
  }

  openTagsFilterDialog() {
    const dialogRef = this.dialog.open(TagsFilterDialog);
    dialogRef.afterClosed().subscribe(result => {
      console.log("aaa")
    });
  }
  
  openEstimateTimeDialog() {
    const dialogRef = this.dialog.open(EstimateTimeDialog);
    dialogRef.afterClosed().subscribe(result => {
      console.log("aaa")
    });
  }

  ngOnInit() {
    this.taskService.currentTasksFilters$.subscribe((filters) => {

      if (filters.length > 0) {
        this.filterValue = filters.filter(filter => filter.label == 'filter')[0];
        this.assignedToValue = filters.filter(filter => filter.label == 'assignedTo')[0];
        this.estimateTime__ltValue = filters.filter(filter => filter.label == 'estimateTime__lt')[0];
        this.estimateTime__gtValue = filters.filter(filter => filter.label == 'estimateTime__gt')[0];
        this.tagsFilterValue = filters.filter(filter => filter.label == 'tags')[0];
      }
    });
  }

  tagsValue() {
    if (this.tagsFilterValue) {
      if (this.tagsFilterValue.value instanceof String || typeof this.tagsFilterValue.value === 'string') {
        return this.tagsFilterValue.value;
      } else if (this.tagsFilterValue.value instanceof Array) {
        return `${this.tagsFilterValue.value.length} selected`;
      }
    } else {
      return '';
    }

  }

}


@Component({
  selector: 'tasks-filter-dialog',
  templateUrl: './tasks-filter-dialog.html'
})
export class TasksFilterDialog {

  filterValues: any = [];
  filterValue: any = {};
  filterValueId: number;

  constructor(public dialogRef: MatDialogRef<TasksFilterDialog>, public taskService: TaskService) {
    this.taskService.currentTasksFilters$.subscribe((filters) => {

      if (filters.length > 0) {
        this.filterValue = filters.filter(filter => filter.label == 'filter')[0];
        this.filterValueId = this.filterValue['id'];
      }

    });

    this.taskService.tasksFilters$.subscribe((filters) => {
      if (filters.length > 0) {
        this.filterValues = filters.filter(filter => filter.label == 'filter');

      }
    });

  }

  changeFilter($event) {
    if (this.filterValues.length > 0) {
      this.filterValue = this.filterValues.filter(filter => filter.label == 'filter' && filter.id == $event.value)[0];
      this.filterValueId = this.filterValue['id'];
      this.taskService.updateCurrentFilter(this.filterValue);
      this.dialogRef.close()

    }

  }

}

@Component({
  selector: 'assigned-to-dialog',
  templateUrl: './assigned-to-dialog.html'
})
export class AssignedToDialog {

  assignedToValues: any = [];
  assignedToValue: any = {};
  assignedToValueId: number;

  constructor(public dialogRef: MatDialogRef<TasksFilterDialog>, public taskService: TaskService) {
    this.taskService.currentTasksFilters$.subscribe((filters) => {

      if (filters.length > 0) {
        this.assignedToValue = filters.filter(filter => filter.label == 'assignedTo')[0];
        this.assignedToValueId = this.assignedToValue['id'];
      }

    });

    this.taskService.tasksFilters$.subscribe((filters) => {
      if (filters.length > 0) {
        this.assignedToValues = filters.filter(filter => filter.label == 'assignedTo');

      }
    });

  }

  changeAssignedTo($event) {
    if (this.assignedToValues.length > 0) {
      this.assignedToValue = this.assignedToValues.filter(assignedTo => assignedTo.label == 'assignedTo' && assignedTo.id == $event.value)[0];
      this.assignedToValueId = this.assignedToValue['id'];
      this.taskService.updateCurrentFilter(this.assignedToValue);
      this.dialogRef.close()
    }
  }

}

@Component({
  selector: 'tags-filter-dialog',
  templateUrl: './tags-filter-dialog.html'
})
export class TagsFilterDialog {
  tagsFilterValue: any;
  tagsFilterValues: any;
  tagsFilterValueId: any;
  tags: Tag[] = [];

  constructor(public dialogRef: MatDialogRef<TasksFilterDialog>, public taskService: TaskService,
              public tagService: TagService) {
    this.taskService.currentTasksFilters$.subscribe((filters) => {
      if (filters.length > 0) {
        this.tagsFilterValue = filters.filter(filter => filter.label == 'tags')[0];
        this.tagsFilterValueId = this.tagsFilterValue['id'];
      }
    });

    this.taskService.tasksFilters$.subscribe((filters) => {
      if (filters.length > 0) {
        this.tagsFilterValues = filters.filter(filter => filter.label == 'tags');
      }
    });

    this.tagService.tags$.subscribe((tags) => {
      this.tags = tags;
    })
  }

  private isInt(value) {
    // @TODO DRY
    return !isNaN(value) && (function (x) {
        return (x | 0) === x;
      })(parseFloat(value))
  }

  changeSelectedTags(tagId: any) {
    let value;
    if (tagId instanceof String || typeof tagId === 'string') {
      value = tagId;
    } else if (this.isInt(tagId)) {
      value = [tagId];
    }
    this.taskService.updateCurrentFilter({'id': 1, 'label': 'tags', 'value': value});
    this.dialogRef.close();
  }

  isActive(tagId: any) {
    return this.tagsFilterValue == tagId;
  }

}



@Component({
  selector: 'task-estimate-time-filter-dialog',
  templateUrl: './task-estimate-time-filter-dialog.html'
})
export class EstimateTimeDialog {

  rangeValues: number[];
  estimateTime__ltValues: any = [];
  estimateTime__ltValue: any = {};
  estimateTime__ltId: number;
  estimateTime__gtValues: any = [];
  estimateTime__gtValue: any = {};
  estimateTime__gtId: number;

  constructor(public dialogRef: MatDialogRef<TasksFilterDialog>, public taskService: TaskService) {
    this.taskService.currentTasksFilters$.subscribe((filters) => {

      if (filters.length > 0) {
        this.estimateTime__ltValue = filters.filter(filter => filter.label === 'estimateTime__lt')[0];
        this.estimateTime__gtValue = filters.filter(filter => filter.label === 'estimateTime__gt')[0];
        this.estimateTime__ltId = this.estimateTime__ltValue['id'];
        this.estimateTime__gtId = this.estimateTime__gtValue['id'];
      }

    });

    this.taskService.tasksFilters$.subscribe((filters) => {
      if (filters.length > 0) {
        this.estimateTime__ltValues = filters.filter(filter => filter.label === 'estimateTime__lt');
        this.estimateTime__gtValues = filters.filter(filter => filter.label === 'estimateTime__gt');

      }
    });
    this.rangeValues = [this.estimateTime__ltId, this.estimateTime__gtId];

  }

  getEstimateTime__lt(id) {
    return this.estimateTime__ltValues.filter(elem => elem.id == id)[0].name;
  }

  getEstimateTime__gt(id) {
    return this.estimateTime__gtValues.filter(elem => elem.id == id)[0].name;
  }

  changeEstimateTime() {
    if (this.estimateTime__ltValues.length > 0 && this.estimateTime__gtValues.length > 0) {
      this.estimateTime__ltValue = this.estimateTime__ltValues.filter(elem => elem.label === 'estimateTime__lt' && elem.id == this.rangeValues[0])[0];
      this.estimateTime__ltId = this.estimateTime__ltValue['id'];

      this.estimateTime__gtValue = this.estimateTime__gtValues.filter(elem => elem.label === 'estimateTime__gt' && elem.id == this.rangeValues[1])[0];
      this.estimateTime__gtId = this.estimateTime__gtValue['id'];
      this.taskService.updateCurrentFilter(this.estimateTime__ltValue);
      this.taskService.updateCurrentFilter(this.estimateTime__gtValue);
      this.dialogRef.close();
    }
  }


}
