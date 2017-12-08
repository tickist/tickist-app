import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[scroller]'
})
export class ScrollerDirective {

  @HostListener('scroll') scrolling(){
    console.log('scrolling');
  }

  @HostListener('click') clicking(){
    console.log('clicking...');
  }

  constructor() { }

}
