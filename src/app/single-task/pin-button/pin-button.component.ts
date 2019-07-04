import {
    AfterViewInit,
    ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, Renderer2,
    ViewChild
} from '@angular/core';

@Component({
    selector: 'tickist-pin-button',
    templateUrl: './pin-button.component.html',
    styleUrls: ['./pin-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PinButtonComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() pinned: boolean;
    @ViewChild('iconElement', { static: true }) iconElement: ElementRef;

    constructor(private elRef: ElementRef, private renderer: Renderer2) {
    }

    ngOnInit() {
    }

    ngOnChanges() {
        if (this.pinned) {
            this.renderer.addClass(this.iconElement.nativeElement, 'pinned');
            this.renderer.removeClass(this.iconElement.nativeElement, 'unpinned');
        } else {
            this.renderer.addClass(this.iconElement.nativeElement, 'unpinned');
            this.renderer.removeClass(this.iconElement.nativeElement, 'pinned');
        }
    }

    ngAfterViewInit() {
        this.renderer.addClass(this.iconElement.nativeElement, 'fa');
        this.renderer.addClass(this.iconElement.nativeElement, 'fa-thumb-tack');

    }

}
