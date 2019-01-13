import {
    AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChange,
    ViewChild,  ChangeDetectorRef
} from '@angular/core';
import {ObservableMedia} from '@angular/flex-layout';
import {Task} from 'app/models/tasks';


@Component({
    selector: 'tickist-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarComponent implements AfterViewChecked, OnChanges {
    @Input() percent: number;
    @Input() isDisabled = false;
    @ViewChild('progressBar') progressBar: ElementRef;
    showProgressBar = false;
    showIcon = false;
    tooltipString: string;

    constructor(private elRef: ElementRef, private media: ObservableMedia, private renderer: Renderer2) {
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (this.media.isActive('xs')) {
            this.showIcon = true;
        } else {
            this.showProgressBar = true;
        }
        if (changes.hasOwnProperty('isDisabled') && changes.isDisabled.currentValue) {
            this.renderer.addClass(this.elRef.nativeElement, 'unvisible');
            this.renderer.removeClass(this.elRef.nativeElement, 'visible');
        } else {
            this.renderer.removeClass(this.elRef.nativeElement, 'unvisible');
            this.renderer.addClass(this.elRef.nativeElement, 'visible');
        }
        if (changes.hasOwnProperty('percent')) {
            this.tooltipString = `${changes.percent.currentValue}%`;
        }
    }

    ngAfterViewChecked() {
        if (this.showProgressBar) {
            this.renderer.setStyle(this.elRef.nativeElement, 'width', '30%');
        }
    }
}
