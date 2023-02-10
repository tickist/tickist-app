import {
    Component,
    Input,
    EventEmitter,
    Output,
    OnChanges, ViewChild, AfterViewInit, ElementRef,
} from "@angular/core";
import { ConfigurationService } from "../../../core/services/configuration.service";
import { TASKS_VIEWS_LIST } from "@data";

@Component({
    selector: "tickist-change-task-view",
    templateUrl: "./change-task-view.component.html",
    styleUrls: ["./change-task-view.component.scss"],
})
export class ChangeTaskViewComponent implements OnChanges, AfterViewInit {
    @Input() defaultTaskView: string;
    @Output() currentTaskViewEvent: EventEmitter<string> =
        new EventEmitter<string>();
    taskView: any;
    tooltipLabel: string;
    currentTaskView: string;
    defaultTaskViewOptions = TASKS_VIEWS_LIST;
    @ViewChild('taskViewSwitch', { read: ElementRef }) element: ElementRef | undefined;
    // eslint-disable-next-line max-len
    extended = 'M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z'
    // eslint-disable-next-line max-len
    // short = 'M336 64h-80c0-35.3-28.7-64-64-64s-64 28.7-64 64H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48zM96 424c-13.3 0-24-10.7-24-24s10.7-24 24-24 24 10.7 24 24-10.7 24-24 24zm0-96c-13.3 0-24-10.7-24-24s10.7-24 24-24 24 10.7 24 24-10.7 24-24 24zm0-96c-13.3 0-24-10.7-24-24s10.7-24 24-24 24 10.7 24 24-10.7 24-24 24zm96-192c13.3 0 24 10.7 24 24s-10.7 24-24 24-24-10.7-24-24 10.7-24 24-24zm128 368c0 4.4-3.6 8-8 8H168c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-96c0 4.4-3.6 8-8 8H168c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16zm0-96c0 4.4-3.6 8-8 8H168c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h144c4.4 0 8 3.6 8 8v16z';
    short = 'M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z';
    constructor(protected configurationService: ConfigurationService) {}

    ngOnChanges() {
        this.currentTaskView = this.defaultTaskView;
        this.currentTaskViewEvent.emit(this.defaultTaskView);
    }

    changeTaskView(event) {
        if (this.currentTaskView === this.defaultTaskViewOptions[0].value) {
            this.currentTaskViewEvent.emit(
                this.defaultTaskViewOptions[1].value
            );
            this.currentTaskView = this.defaultTaskViewOptions[1].value;
            this.tooltipLabel = "Change to extended view";
        } else {
            this.currentTaskViewEvent.emit(
                this.defaultTaskViewOptions[0].value
            );
            this.currentTaskView = this.defaultTaskViewOptions[0].value;
            this.tooltipLabel = "Change to simple view";
        }
    }

    ngAfterViewInit(): void {
        if (this.element){
            this.element.nativeElement.querySelector('.mdc-switch__icon--on').firstChild.setAttribute('d', this.short);
            this.element.nativeElement.querySelector('.mdc-switch__icon--off').firstChild.setAttribute('d', this.extended);
        }
    }
}
