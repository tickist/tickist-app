import {ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, Renderer2, ViewChild} from '@angular/core';

@Component({
  selector: 'tickist-toggle-button',
  templateUrl: './toggle-button.component.html',
  styleUrls: ['./toggle-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleButtonComponent implements OnInit {
  @Input() status: number;
  @Input() priority: string;
  @ViewChild('iconElement') iconElement: ElementRef;
  constructor(private elRef: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.renderer.addClass(this.elRef.nativeElement, this.priority);
    this.renderer.addClass(this.iconElement.nativeElement, 'fa');
    switch (this.status) {
      case 0:
        this.renderer.addClass(this.iconElement.nativeElement, 'fa-square-o');
        break;
      case 1:
        this.renderer.addClass(this.iconElement.nativeElement, 'fa-check-square-o');
        break;
      case 2:
        this.renderer.addClass(this.iconElement.nativeElement, 'fa-pause');
        break;
      default:
        break;
    }
  }
}
