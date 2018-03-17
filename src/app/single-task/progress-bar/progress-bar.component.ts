import {
    AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, Renderer2,
    ViewChild
} from '@angular/core';
import {ObservableMedia} from '@angular/flex-layout';

@Component({
    selector: 'tickist-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarComponent implements OnInit, AfterViewInit {
    @Input() percent: number;
    @Input() isDisabled = false;
    @ViewChild('progressBar') progressBar: ElementRef;
    showProgressBar = false;
    showIcon = false;

    constructor(private elRef: ElementRef, protected media: ObservableMedia, private renderer: Renderer2) {
    }

    ngOnInit() {
        if (this.media.isActive('xs')) {
            this.showIcon = true;
        } else {
            this.showProgressBar = true;
        }
    }

    ngAfterViewInit() {
        if (this.showProgressBar) {
            this.renderer.setStyle(this.elRef.nativeElement, 'width', '30%');
        }
        if (this.isDisabled) {
            // @TODO add class disabled instead of this approach
            this.renderer.setStyle(this.elRef.nativeElement, 'pointer-events', 'none');
            this.renderer.setStyle(this.elRef.nativeElement, 'visibility', 'hidden');
        }
    }
}
