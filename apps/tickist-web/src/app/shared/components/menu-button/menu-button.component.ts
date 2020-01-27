import {
    ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChange,
    ViewChild
} from '@angular/core';
import { IconPrefix } from '@fortawesome/fontawesome-common-types';

@Component({
    selector: 'tickist-menu-button',
    templateUrl: './menu-button.component.html',
    styleUrls: ['./menu-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuButtonComponent implements OnInit, OnChanges {
    @Input() icon: any;
    @Input() iconPrefix: IconPrefix = 'fas';
    @Input() color = 'white';
    @Input() isDisabled = false;
    @Input() fontSize = '16px';
    @Input() transform = '';
    isDisabledClass = '';

    constructor(private elRef: ElementRef, private renderer: Renderer2) {
    }

    ngOnInit() {
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes.hasOwnProperty('isDisabled') && changes.isDisabled.currentValue) {
            this.isDisabledClass = 'unvisible';
        } else {
            this.isDisabledClass = 'visible';
        }
    }

}
