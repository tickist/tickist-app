import {
  Component, OnInit, Input, OnDestroy, ViewChild, OnChanges, AfterViewInit,
  ChangeDetectionStrategy
} from '@angular/core';
import {Task} from '../models/tasks';
import {MediaChange, ObservableMedia} from "@angular/flex-layout";
import {Subscription} from "rxjs";
import {VirtualScrollComponent} from "angular2-virtual-scroll";


@Component({
  selector: 'app-tasks-list',
  templateUrl: './tasks-list.component.html',
  styleUrls: ['./tasks-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksListComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() tasks: Task[];
  @Input() taskView: string;
  watcher: Subscription;
  mediaChange: MediaChange;

  @ViewChild('virtualScroll')
  private virtualScroll: VirtualScrollComponent;

  // call this function after resize + animation end
  afterResize() {
    if (this.virtualScroll)
      this.virtualScroll.refresh();
    console.log(this.virtualScroll)
  }

  constructor(protected media: ObservableMedia) {

  }

  ngAfterViewInit() {
    // After the view is initialized, this.userProfile will be available
    console.log(this.virtualScroll)
  }



  ngOnInit() {
     console.log(this.taskView);
     this.watcher = this.media.subscribe((mediaChange: MediaChange) => {
        this.mediaChange = mediaChange;
     });
     console.log("ngOnInit tasks list")

  }
  ngOnDestroy() {
    this.watcher.unsubscribe();
  }

  ngOnChanges() {
    //console.log(this.tasks);
    //debugger;
    //this.afterResize()
  }
  trackByFn(index, item) {
    //console.log("item", item)
    //console.log("index", index)
    return item.id
  }

  debFun (a,b,c) {
      debugger
  }

}
