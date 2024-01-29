import { ChangeDetectionStrategy, Component, ElementRef, Input, Renderer2 } from "@angular/core";
import { ExtendedModule } from "@ngbracket/ngx-layout/extended";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { NgIf, NgClass } from "@angular/common";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
    selector: "tickist-pin-button",
    templateUrl: "./pin-button.component.html",
    styleUrls: ["./pin-button.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatTooltipModule,
        NgIf,
        FaIconComponent,
        NgClass,
        ExtendedModule,
    ],
})
export class PinButtonComponent {
    @Input() pinned: boolean;

    // @ViewChild('iconElement', { static: true }) iconElement: ElementRef;

    constructor(
        private elRef: ElementRef,
        private renderer: Renderer2,
    ) {}

    // ngOnInit() {
    // }
    //
    // ngOnChanges() {
    // if (this.pinned) {
    //     this.renderer.addClass(this.iconElement.nativeElement, 'pinned');
    //     this.renderer.removeClass(this.iconElement.nativeElement, 'unpinned');
    // } else {
    //     this.renderer.addClass(this.iconElement.nativeElement, 'unpinned');
    //     this.renderer.removeClass(this.iconElement.nativeElement, 'pinned');
    // }
    // }

    // ngAfterViewInit() {
    //     this.renderer.addClass(this.iconElement.nativeElement, 'fa');
    //     this.renderer.addClass(this.iconElement.nativeElement, 'fa-thumb-tack');
    //
    // }
}
