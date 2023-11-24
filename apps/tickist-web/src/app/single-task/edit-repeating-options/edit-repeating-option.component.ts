import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import { ConfigurationService } from "../../core/services/configuration.service";
import { Task } from "@data/tasks/models/tasks";
import { requestUpdateTask } from "../../core/actions/tasks/task.actions";
import { Store } from "@ngrx/store";

@Component({
    selector: "tickist-edit-repeating-option",
    templateUrl: "./edit-repeating-option.html",
    styleUrls: ["./edit-repeating-option.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditRepeatingOptionComponent implements OnInit {
    @Input() task: Task;
    defaultRepeatOptions: any; // Array<{}> = [];
    customRepeatOptions: any; // Array<{}> = [];
    fromRepeatingOptions: any; // Array<{}> = [];
    repeatDelta: any;
    repeatDefault: any;
    repeatCustom: any;
    fromRepeating: any;

    constructor(
        protected configurationService: ConfigurationService,
        private store: Store,
    ) {}

    ngOnInit() {
        if (!this.task) {
            throw new Error("Task cannot be null");
        }
        this.defaultRepeatOptions = this.configurationService.loadConfiguration().commons.defaultRepeatOptions;
        this.customRepeatOptions = this.configurationService.loadConfiguration().commons.customRepeatOptions;
        this.fromRepeatingOptions = this.configurationService.loadConfiguration().commons.fromRepeatingOptions;

        if (this.task?.repeatDelta > 1) {
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
        let task;
        if (source === "repeatDefault") {
            let repeat, repeatDelta;
            if ($event.value !== 99) {
                repeat = $event.value;
                repeatDelta = 1;
            } else {
                repeatDelta = this.repeatDelta;
                repeat = this.repeatCustom;
            }
            task = Object.assign({}, this.task, {
                repeat: repeat,
                repeatDelta: repeatDelta,
            });
        } else if (source === "repeatDelta") {
            task = Object.assign({}, this.task, { repeatDelta: $event.value });
        } else if (source === "repeatCustom") {
            task = Object.assign({}, this.task, { repeat: $event.value });
        } else if (source === "fromRepeating") {
            task = Object.assign({}, this.task, {
                fromRepeating: $event.value,
            });
        }
        this.store.dispatch(requestUpdateTask({ task: { id: task.id, changes: task } }));
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
