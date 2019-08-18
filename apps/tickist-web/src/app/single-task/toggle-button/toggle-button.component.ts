import {
    AfterViewInit,
    ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChange,
    ViewChild
} from '@angular/core';

@Component({
    selector: 'tickist-toggle-button',
    templateUrl: './toggle-button.component.html',
    styleUrls: ['./toggle-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleButtonComponent implements OnInit {
    @Input() isDone: boolean;
    @Input() onHold: boolean;
    @Input() priority: string;
    icon: Array<string>;

    constructor() {
    }

    ngOnInit() {
        if (this.isDone && !this.onHold) {
            this.icon = ['far', 'check-square'];
        } else if (!this.isDone && !this.onHold) {
            this.icon = ['far', 'square'];
        } else if (this.onHold) {
            this.icon = ['fas', 'pause'];
        }
    }

}
