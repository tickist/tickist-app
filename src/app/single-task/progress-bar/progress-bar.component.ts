import {
    AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChange,
    ViewChild
} from '@angular/core';
import {ObservableMedia} from '@angular/flex-layout';

@Component({
    selector: 'tickist-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarComponent implements OnInit, AfterViewInit, OnChanges {
    @Input() percent: number;
    @Input() isDisabled = false;
    @ViewChild('progressBar') progressBar: ElementRef;
    showProgressBar = false;
    showIcon = false;

    constructor(private elRef: ElementRef, private media: ObservableMedia, private renderer: Renderer2) {
    }

    ngOnInit() {
        if (this.media.isActive('xs')) {
            this.showIcon = true;
        } else {
            this.showProgressBar = true;
        }
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes.hasOwnProperty('isDisabled') && changes.isDisabled.currentValue) {
            // @TODO add class disabled instead of this approach
            this.renderer.setStyle(this.elRef.nativeElement, 'pointer-events', 'none');
            this.renderer.setStyle(this.elRef.nativeElement, 'visibility', 'hidden');
        }
    }

    ngAfterViewInit() {
        if (this.showProgressBar) {
            this.renderer.setStyle(this.elRef.nativeElement, 'width', '30%');
        }
    }
}
