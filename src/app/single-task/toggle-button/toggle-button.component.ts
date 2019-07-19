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
    @Input() status: number;
    @Input() priority: string;
    icon: Array<string>;

    constructor() {
    }

    ngOnInit() {
        switch (this.status) {
            case 0:
                this.icon = ['far', 'square'];
                // this.renderer.addClass(this.iconElement.nativeElement, 'fa-square-o');
                break;
            case 1:
                this.icon = ['far', 'check-square'];
                // this.renderer.addClass(this.iconElement.nativeElement, 'fa-check-square-o');
                break;
            case 2:
                this.icon = ['fas', 'pause'];
                // this.renderer.addClass(this.iconElement.nativeElement, 'fa-pause');
                break;
            default:
                break;
        }
    }

}
