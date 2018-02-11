import {
  Component, OnInit, Input, OnDestroy, OnChanges, AfterViewInit,
  ChangeDetectionStrategy
} from '@angular/core';
import {Task} from '../models/tasks';
import {MediaChange, ObservableMedia} from '@angular/flex-layout';
import {Subscription} from 'rxjs/Subscription';


@Component({
  selector: 'app-tasks-list',
  templateUrl: './tasks-list.component.html',
  styleUrls: ['./tasks-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksListComponent implements OnInit, OnDestroy {
  @Input() tasks: Task[];
  @Input() taskView: string;
  watcher: Subscription;
  mediaChange: MediaChange;
    
  constructor(protected media: ObservableMedia) {

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
    
  trackByFn(index, item) {
    //console.log("item", item)
    //console.log("index", index)
    return item.id
  }



}
