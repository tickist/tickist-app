import {Component} from '@angular/core';

@Component({
  selector: 'blank-cmp',
  template: ``
})
export class BlankComponent {
}

@Component({
  selector: 'root-cmp',
  template: `<router-outlet></router-outlet>`
})
export class RootComponent {
}
