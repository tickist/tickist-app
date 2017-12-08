import {
  Component, OnInit, Input, OnDestroy, ChangeDetectionStrategy, OnChanges, SimpleChange,
  ChangeDetectorRef
} from '@angular/core';
import {Project} from '../models/projects';
import {ProjectService} from '../services/projectService';
import {Router} from '@angular/router';
import {ConfigurationService} from '../services/configurationService';
import 'rxjs/add/operator/takeUntil';
import { Subject } from 'rxjs/Subject';
import {ObservableMedia} from "@angular/flex-layout";

class Timer {
  readonly start = performance.now();

  constructor(private readonly name: string) {}

  stop() {
    const time = performance.now() - this.start;
    console.log('Timer:', this.name, 'finished in', Math.round(time), 'ms');
  }
}


@Component({
  selector: 'single-project',
  templateUrl: './single-project.component.html',
  styleUrls: ['./single-project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleProjectComponent implements OnInit, OnDestroy, OnChanges {

  private t: Timer;
  @Input() project: Project;
  @Input() isSmallScreen: boolean;
  @Input() selectedProjectsIds: Array<number>;
  @Input() selectedProject: Project;
  isActive = false;
  activeCheckboxMode = false;
  isSelected = false;


  constructor(private projectService: ProjectService, protected router: Router,
              protected configurationService: ConfigurationService, protected media: ObservableMedia) {
  }

  ngOnInit() {
  }

  // // When change detection begins
  // ngDoCheck() {
  //   this.t = new Timer(`single task component ${this.project.name}`)
  // }
  //
  //
  // ngAfterViewChecked() {
  //   this.t.stop();  // Prints the time elapsed to the JS console.
  // }
  //

  ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
    //console.log("changes", changes);
    // if (this.mediaChange && (this.mediaChange.mqAlias === 'xs' || this.mediaChange.mqAlias === 'sm')) {
    //   this.isSmallScreen = true;
    // } else {
    //   this.isSmallScreen = false;
    // }
    console.log(this.isActive);
    this.isActive = this.selectedProjectsIds && this.selectedProjectsIds.indexOf(this.project.id) > -1;

    if (this.selectedProject && this.selectedProject.allDescendants.indexOf(this.project.id) > -1 ) {
      this.isSelected = true;
      if (this.selectedProject.allDescendants.length > 1) {
        this.activeCheckboxMode = true;
      }
    } else {
      this.isSelected = false;
      this.activeCheckboxMode = false;
    }
  }

  ngOnDestroy() {
  }

  changeId() {
    if (this.isActive) {
      this.projectService.updateElementFromSelectedProjectsIds(this.project.id);
    } else {
      this.projectService.deleteElementFromSelectedProjectsIds(this.project.id);
    }
  }

  navigateTo(path, projectId, $event) {
    const elementClickPath = $event.path;
    const mdCheckbox = elementClickPath.find(elem => elem.localName === 'mat-checkbox');
    if (!mdCheckbox) {
      this.router.navigate([path, projectId]);
      if (this.media.isActive('sm') || this.media.isActive('xs')) {
        this.configurationService.changeOpenStateLeftSidenavVisibility('close');
      }
    }
  }

}
