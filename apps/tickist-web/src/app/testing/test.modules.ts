import {Component} from '@angular/core';

@Component({
  selector: 'tickist-blank-cmp',
  template: ``
})
export class BlankComponent {
}

@Component({
  selector: 'tickist-root-cmp',
  template: `<router-outlet></router-outlet>`
})
export class RootComponent {
}
