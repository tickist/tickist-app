import {
    Component, OnInit, Input, OnDestroy, ChangeDetectionStrategy
} from '@angular/core';
import {Task} from '../models/tasks';
import {MediaChange, ObservableMedia} from '@angular/flex-layout';
import {Subscription} from 'rxjs';
import {ConfigurationService} from '../services/configurationService';


@Component({
    selector: 'app-tasks-list',
    templateUrl: './tasks-list.component.html',
    styleUrls: ['./tasks-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksListComponent implements OnInit, OnDestroy {
    @Input() tasks: Task[];
    @Input() taskView: string;
    @Input() virtualScrollEnabled = true;
    watcher: Subscription;
    mediaChange: MediaChange;
    task_simple_view_value: string;
    task_extended_view_value: string;

    constructor(protected media: ObservableMedia, protected configurationService: ConfigurationService) {
        this.task_simple_view_value = this.configurationService.TASK_SIMPLE_VIEW.value;
        this.task_extended_view_value = this.configurationService.TASK_EXTENDED_VIEW.value;
    }

    ngOnInit() {
        this.watcher = this.media.subscribe((mediaChange: MediaChange) => {
            this.mediaChange = mediaChange;
        });
    }

    ngOnDestroy() {
        this.watcher.unsubscribe();
    }

    trackByFn(index, item) {
        return item.id;
    }


}
