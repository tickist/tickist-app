import {Component, OnInit, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges} from '@angular/core';
import {ConfigurationService} from '../services/configuration.service';
import {Task} from '../models/tasks';
import {TaskService} from '../services/task.service';


@Component({
    selector: 'app-edit-repeating-option',
    templateUrl: './edit-repeating-option.html',
    styleUrls: ['./edit-repeating-option.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditRepeatingOptionComponent implements OnInit {

    defaultRepeatOptions: any; // Array<{}> = [];
    customRepeatOptions: any; // Array<{}> = [];
    fromRepeatingOptions: any; // Array<{}> = [];
    repeatDelta: any;
    repeatDefault: any;
    repeatCustom: any;
    fromRepeating: any;
    @Input() task: Task;

    constructor(protected configurationService: ConfigurationService, protected taskService: TaskService) {
    }

    ngOnInit() {
        if (!this.task) {
            throw new Error('Task cannot be null');
        }
        this.defaultRepeatOptions = this.configurationService.loadConfiguration()['commons']['DEFAULT_REPEAT_OPTIONS'];
        this.customRepeatOptions = this.configurationService.loadConfiguration()['commons']['CUSTOM_REPEAT_OPTIONS'];
        this.fromRepeatingOptions = this.configurationService.loadConfiguration()['commons']['FROM_REPEATING_OPTIONS'];

        if (this.task.hasOwnProperty('repeatDelta') && this.task.repeatDelta > 1) {
            this.repeatDelta = this.task.repeatDelta;
            this.repeatDefault = 99;
        } else {
            this.repeatDelta = 2;
            this.repeatDefault = this.task.repeat;
        }
        this.repeatCustom = this.task.repeat;
        this.fromRepeating = this.task.fromRepeating;
    }

    saveTask($event: any, source: string) {
        if (source === 'repeatDefault') {
            if ($event.value !== 99) {
                this.task.repeat = $event.value;
                this.task.repeatDelta = 1;
            } else {
                this.task.repeatDelta = this.repeatDelta;
                this.task.repeat = this.repeatCustom;
            }
        } else if (source === 'repeatDelta') {
            this.task.repeatDelta = $event.value;
        } else if (source === 'repeatCustom') {
            this.task.repeat = $event.value;
        } else if (source === 'fromRepeating') {
            this.task.fromRepeating = $event.value;
        }
        this.taskService.updateTask(this.task, true);
        // if (this.repeatDefault !== 99) {
        //     this.task.repeat = this.repeatDefault;
        //     this.task.repeatDelta = 1;
        // } else {
        //   this.task.repeatDelta = this.repeatDelta;
        //   this.task.repeat = this.repeatCustom;
        // }
        // this.task.fromRepeating = this.fromRepeating;
        // this.taskService.updateTask(this.task, true);
    }
}
