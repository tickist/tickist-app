import {Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy} from '@angular/core';
import {ConfigurationService} from '../../services/configurationService';
import {Task} from '../../models/tasks';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import * as moment from 'moment';
import * as _ from 'lodash';
import {MediaChange, ObservableMedia} from "@angular/flex-layout";
import {TaskService} from "../../services/taskService";


@Component({
  selector: 'app-dashboard',
  templateUrl: './weekdays.component.html',
  styleUrls: ['./weekdays.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeekDaysComponent implements OnInit, OnDestroy {
  activeDay: moment.Moment;
  today: moment.Moment;
  tasks: Task[] = [];
  week: Array<any> = [];
  subscriptions: Subscription;
  mediaChange: MediaChange;

  constructor(private route: ActivatedRoute, private cd: ChangeDetectorRef, protected taskService: TaskService,
              private configurationService: ConfigurationService, protected router: Router,
              protected media: ObservableMedia) {
    this.today = moment();

  }

  isToday(date = this.activeDay) {
    const today = moment().format('DD-MM-YYYY');
    return (today === date.format('DD-MM-YYYY'));
  }

  ngOnInit() {
    this.subscriptions = this.route.params.map(params => params['date']).subscribe((param) => {
      this.configurationService.updateActiveDay(param);
    });
    this.subscriptions.add(this.media.subscribe((mediaChange: MediaChange) => {
      console.log(mediaChange);
      this.mediaChange = mediaChange;
    }));
    this.subscriptions.add(this.configurationService.activeDay$.subscribe((activeDay) => {
      this.activeDay = activeDay;
      this.cd.markForCheck(); // marks path

    }));
    this.subscriptions.add(this.taskService.tasks$.subscribe(tasks => {
      this.tasks = tasks;
      this.feelWeekData();
    }));
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  isSelected(day) {
    return (day.date === this.activeDay.format('DD-MM-YYYY'));
  }

  navigateTo(path, arg) {
    this.router.navigate([path, arg]);
    if (this.media.isActive('sm') || this.media.isActive('xs')) {
      this.configurationService.changeOpenStateLeftSidenavVisibility('close');
    }
  }
  chooseDay(date) {
    this.navigateTo('/home', date);
  }

  feelWeekData() {
    let nextDay = moment();
    this.week = [];
    for (let i = 0; i < 7; i++) {
      this.week.push({
        'name': nextDay.format('dddd'),
        'date': nextDay.format('DD-MM-YYYY'),
        'tasksCounter': this.tasks.filter(task => {
          const finishDate = task.finishDate;
          return (
            (finishDate && (finishDate.format('DD-MM-YYYY') === nextDay.format('DD-MM-YYYY'))) ||
            (this.isToday(nextDay) && task.pinned)
          );
        }).length
      });
      nextDay = nextDay.add(1, 'days');
    }
  }

}

