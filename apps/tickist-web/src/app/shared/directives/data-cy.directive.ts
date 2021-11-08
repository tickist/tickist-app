import { Directive, ElementRef, Input, Renderer2 } from "@angular/core";
import { environment } from "../../../environments/environment";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[dataCy], [data-cy]",
})
export class DataCyDirective {
    @Input() dataCy: any;
    constructor(private el: ElementRef, private renderer: Renderer2) {
        if (environment.production && !environment.e2eTest) {
            this.renderer.removeAttribute(el.nativeElement, "data-cy");
        }
    }
}
