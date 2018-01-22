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
export class ToggleButtonComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() status: number;
    @Input() priority: string;
    @ViewChild('iconElement') iconElement: ElementRef;

    constructor(private elRef: ElementRef, private renderer: Renderer2) {
    }

    ngOnInit() {
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes.hasOwnProperty('priority')) {
            this.renderer.removeClass(this.elRef.nativeElement, changes.priority.previousValue);
            this.renderer.addClass(this.elRef.nativeElement, changes.priority.currentValue);
        }
    }

    ngAfterViewInit() {
        this.renderer.addClass(this.elRef.nativeElement, this.priority);
        this.renderer.addClass(this.iconElement.nativeElement, 'fa');
        switch (this.status) {
            case 0:
                this.renderer.addClass(this.iconElement.nativeElement, 'fa-square-o');
                break;
            case 1:
                this.renderer.addClass(this.iconElement.nativeElement, 'fa-check-square-o');
                break;
            case 2:
                this.renderer.addClass(this.iconElement.nativeElement, 'fa-pause');
                break;
            default:
                break;
        }
    }
}
