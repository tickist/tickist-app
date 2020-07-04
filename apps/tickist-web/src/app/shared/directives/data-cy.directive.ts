import {Directive, ElementRef, Input, Renderer2} from '@angular/core';
import {environment} from "@env/environment";

@Directive({
    // tslint:disable-next-line:directive-selector
    selector: '[dataCy], [data-cy]'
})
export class DataCyDirective {
    @Input() dataCy: any;
    constructor(private el: ElementRef, private renderer: Renderer2) {
        if (environment.production && !environment.e2eTest) {
            this.renderer.removeAttribute(el.nativeElement, 'data-cy');
        }
    }

}
