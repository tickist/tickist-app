import {
    AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChange,
    ViewChild
} from '@angular/core';

@Component({
    selector: 'tickist-menu-button',
    templateUrl: './menu-button.component.html',
    styleUrls: ['./menu-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuButtonComponent implements OnInit, AfterViewInit, OnChanges {
    @Input() icon: string;
    @Input() color = 'white';
    @Input() isDisabled = false;
    @Input() fontSize = '16px';
    @Input() transform = '';
    @ViewChild('icon') iconElement: ElementRef;

    constructor(private elRef: ElementRef, private renderer: Renderer2) {
    }

    ngOnInit() {
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes.hasOwnProperty('isDisabled') && changes.isDisabled.currentValue) {
            // @TODO add class disabled instead of this
            this.renderer.setStyle(this.elRef.nativeElement, 'pointer-events', 'none');
            this.renderer.setStyle(this.elRef.nativeElement, 'visibility', 'hidden');
        }
    }

    ngAfterViewInit() {
        this.renderer.addClass(this.iconElement.nativeElement, 'fa');
        this.renderer.setStyle(this.iconElement.nativeElement, 'color', this.color);
        this.renderer.addClass(this.iconElement.nativeElement, this.icon);
        if (this.fontSize) {
            this.renderer.setStyle(this.iconElement.nativeElement, 'font-size', this.fontSize);
        }
        if (this.transform) {
            this.renderer.setStyle(this.iconElement.nativeElement, 'transform', this.transform);
        }


    }

}
