import {Component} from '@angular/core';
import { RouterOutlet } from '@angular/router';

// @Component({
//   selector: 'tickist-blank-cmp',
//   template: ``
// })
// export class BlankComponent {
// }

@Component({
    selector: 'tickist-root-cmp',
    template: `<router-outlet></router-outlet>`,
    standalone: true,
    imports: [RouterOutlet]
})
export class RootComponent {
}
