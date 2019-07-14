import {
    AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChange,
    ViewChild
} from '@angular/core';
import {Task} from '../../models/tasks';


@Component({
    selector: 'tickist-display-finish-date',
    templateUrl: './display-finish-date.component.html',
    styleUrls: ['./display-finish-date.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayFinishDateComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() task: Task;
    @ViewChild('typeFinishDateIcon', { static: true }) typeFinishDateIcon: ElementRef;
    @ViewChild('finishTime', { static: false }) finishTime: ElementRef;
    @ViewChild('finishTimeIcon', { static: false }) finishTimeIcon: ElementRef;
    dateFormat = 'DD-MM-YYYY';
    finishDateFormat: string;

    constructor(private renderer: Renderer2) {
    }

    ngOnInit() {
        if (!this.task) {
            throw new Error(`Attribute 'task' is required`);
        }
        
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        console.log(changes);
        if (changes.hasOwnProperty('task')) {
            this.addTypeFinishDateIcon();
        }
    }

    ngAfterViewInit() {
        this.renderer.addClass(this.typeFinishDateIcon.nativeElement, 'fa');
        this.addTypeFinishDateIcon();

        this.renderer.setStyle(this.typeFinishDateIcon.nativeElement, 'margin-right', '3px');
        if (this.finishTime) {
            this.renderer.addClass(this.finishTimeIcon.nativeElement, 'fa');
            this.renderer.addClass(this.finishTimeIcon.nativeElement, 'fa-clock-o');
            this.renderer.setStyle(this.finishTime.nativeElement, 'margin-right', '3px');
            this.renderer.setStyle(this.finishTime.nativeElement, 'margin-left', '3px');
        }
    }

    addTypeFinishDateIcon() {
        this.renderer.removeClass(this.typeFinishDateIcon.nativeElement, 'fa-dot-circle-o');
        this.renderer.removeClass(this.typeFinishDateIcon.nativeElement, 'fa-arrow-right');
        if (this.task.typeFinishDate === 1) {
            this.renderer.addClass(this.typeFinishDateIcon.nativeElement, 'fa-dot-circle-o');
        } else if (this.task.typeFinishDate === 0) {
            this.renderer.addClass(this.typeFinishDateIcon.nativeElement, 'fa-arrow-right');
        }
        this.finishDateFormat = this.task.finishDate.format(this.dateFormat);
    }

}
