import {ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, Renderer2, ViewChild} from '@angular/core';
import {Task} from '../../models/tasks';
@Component({
  selector: 'tickist-display-finish-date',
  templateUrl: './display-finish-date.component.html',
  styleUrls: ['./display-finish-date.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayFinishDateComponent implements OnInit {
  @Input() task: Task;
  @ViewChild('typeFinishDateIcon') typeFinishDateIcon: ElementRef;
  dateFormat = 'DD-MM-YYYY';

  constructor(private elRef: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
      this.renderer.addClass(this.typeFinishDateIcon.nativeElement, 'fa');
      if (this.task.typeFinishDate === 1) {
         this.renderer.addClass(this.typeFinishDateIcon.nativeElement, 'fa-dot-circle-o');
      } else if (this.task.typeFinishDate === 0) {
         this.renderer.addClass(this.typeFinishDateIcon.nativeElement, 'fa-arrow-right');
      }
      this.renderer.setStyle(this.typeFinishDateIcon.nativeElement, 'margin-right', '3px');
  }

}
