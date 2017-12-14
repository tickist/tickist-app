import {Component, OnInit, OnDestroy, ViewChild, Renderer2} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TaskService} from '../services/taskService';
import {TagService} from '../services/tagService';
import {Task, Step} from '../models/tasks';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/observable/combineLatest';
import {ProjectService} from '../services/projectService';
import {UserService} from '../services/userService';
import {Project} from '../models/projects';
import {ConfigurationService} from '../services/configurationService';
import {User, SimplyUser} from '../models/user';
import {FormBuilder, FormGroup, Validators, FormArray, FormControl} from '@angular/forms';
import {Location} from '@angular/common';
import {Minutes2hoursPipe} from '../pipes/minutes2hours';
import {MatDialogRef, MatDialog, MatAutocompleteSelectedEvent} from '@angular/material';
import * as moment from 'moment';
import {Tag} from '../models/tags';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import {MatAutocompleteTrigger} from '@angular/material';

@Component({
  selector: 'app-task-component',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, OnDestroy {
  task: Task;
  stream$: Observable<any>;
  projects: Project[];
  selectedProject: Project;
  menu: {};
  user: User;
  taskForm: FormGroup;
  defaultRepeatOptions: {};
  customRepeatOptions: {};
  fromRepetingOptions: {};
  typeFinishDateOptions: any;
  defaultFinishDateOptions: any;
  minutes2Hours: Minutes2hoursPipe;
  steps: any;
  minDate: Date;
  subscriptions: Subscription;
  tagsCtrl: FormControl;
  filteredTags: Observable<any>;
  tags: Tag[] = [];
  test: any;
  minFilter: any;
  // @ViewChild(MdAutocompleteTrigger) trigger;

  @ViewChild('finishDate') finishDateViewChild;
  @ViewChild('finishTime') finishTimeViewChild;
  @ViewChild('suspendedDate') suspendedDateViewChild;
  @ViewChild('trigger', {read: MatAutocompleteTrigger}) trigger: MatAutocompleteTrigger;
  @ViewChild('autocompleteTags') autocompleteTags;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private taskService: TaskService,
              private projectService: ProjectService, private userService: UserService, public dialog: MatDialog,
              private configurationService: ConfigurationService, private location: Location,
              private tagService: TagService, protected renderer: Renderer2) {
  }

  ngOnInit() {
    this.minutes2Hours = new Minutes2hoursPipe;
    this.minDate = new Date();
    this.defaultRepeatOptions = this.configurationService.loadConfiguration()['commons']['DEFAULT_REPEAT_OPTIONS'];
    this.customRepeatOptions = this.configurationService.loadConfiguration()['commons']['CUSTOM_REPEAT_OPTIONS'];
    this.fromRepetingOptions = this.configurationService.loadConfiguration()['commons']['FROM_REPEATING_OPTIONS'];
    this.typeFinishDateOptions = this.configurationService.loadConfiguration()['commons']['TYPE_FINISH_DATE_OPTIONS'];
    this.defaultFinishDateOptions = this.configurationService.configuration['commons']['CHOICES_DEFAULT_FINISH_DATE'];
    this.typeFinishDateOptions = this.configurationService.configuration['commons']['TYPE_FINISH_DATE_OPTIONS'];
    this.stream$ = Observable
      .combineLatest(
        this.taskService.tasks$,
        this.route.params.map(params => params['taskId']),
        this.projectService.selectedProject$,
        this.projectService.projects$,
        this.userService.user$,
        (tasks: Task[], taskId: any, selectedProject: Project, projects: Project[], user: User) => {
          let task: Task;
          if (projects && tasks && projects.length > 0 && user && tasks.length > 0) {
            this.user = user;
            this.projects = projects;
            if (taskId) {
              task = tasks.filter(t => t.id === parseInt(taskId, 10))[0];
            } else {
              if (!selectedProject) {
                this.selectedProject = projects.filter(project => project.id === user.inboxPk)[0];
              } else {
                this.selectedProject = selectedProject;
              }
              task = this.createNewTask(this.selectedProject);
            }
          }
          return task;
        }
      );
    this.menu = this.createMenuDict();

    this.subscriptions = this.stream$.subscribe((task) => {
      if (task) {
        this.task = task;
        this.createFinishDateFilter();
        this.taskForm = this.createTaskForm(task);
      }
    });
    this.subscriptions.add(
      this.tagService.tags$.subscribe((tags: Tag[]) => {
        this.tags = tags;
        // this.filteredTags = this.tags.filter((tag) => this.task)
      })
    );

    this.tagsCtrl = new FormControl();
    this.filteredTags = this.tagsCtrl.valueChanges
      .startWith(null)
      .map(name => this.filterTags(name));

    this.configurationService.changeOpenStateLeftSidenavVisibility('close');
    this.configurationService.changeOpenStateRightSidenavVisibility('close');
  }

  filterTags(val: string) {
    console.log(val);
    if (val) {
      const tagsIds = [];
      this.task.tags.forEach((tag: Tag) => {
        tagsIds.push(tag.id);
      });
      const aa = [...this.tags.filter(u => tagsIds.indexOf(u['id']) === -1).filter(u => new RegExp(val, 'gi').test(u.name)), {'name': val}];
      return aa;
      // val ? this.tags.filter((s) => new RegExp(val, 'gi').test(s.name)) : {'name': val};
    }
    return [];
  }

  autocompleteTagsDisplayFn(tag: Tag): string | Tag {
    return tag ? tag.name : tag;
  }

  private createFinishDateFilter() {
    if (!this.task.finishDate || this.task.finishDate >= this.minDate) {
      this.minFilter = (d: Date): boolean => this.minDate.setHours(0, 0, 0, 0) <= d.setHours(0, 0, 0, 0);
    } else {
      this.minFilter = (d: Date): boolean => true;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.configurationService.updateLeftSidenavVisibility();
    this.configurationService.updateRightSidenavVisibility();
  }

  createMenuDict() {
    return {
      'main': true, 'extra': false, 'tags': false, 'steps': false, 'dateAndTime': false,
      'repeat': false, 'notifications': false
    };
  }

  createTaskForm(task: Task) {
    const repeat = {'repeatDelta': 1, 'repeatDefault': 0, 'repeatCustom': 1};
    let finishDate, finishTime;
    if (task.finishDate) {
      finishDate = task.finishDate.toDate();
    }
    if (task.finishTime) {
      finishTime = task.finishTime;
    }
    if (task.repeatDelta > 1) {
      repeat.repeatDelta = task.repeatDelta;
      repeat.repeatDefault = 99;
    } else {
      repeat.repeatDelta = 1;
      repeat.repeatDefault = task.repeat;
    }
    repeat.repeatCustom = task.repeat;

    return this.fb.group({
      'main': this.fb.group({
        'name': [task.name, [Validators.required, Validators.max(100)]],
        'priority': [task.priority, Validators.required],
        'taskProjectPk': [task.taskProject.id, Validators.required],
        'typeFinishDate': [task.typeFinishDate, Validators.required],
        'finishDate': [finishDate],
        'finishTime': [finishTime],
      }),
      'extra': this.fb.group({
        'description': [task.description],
        'time': [this.minutes2Hours.transform(task.time)],
        'estimateTime': [this.minutes2Hours.transform(task.estimateTime)],
        'ownerId': [task.owner.id, Validators.required],
        'suspended': [(task.status === 2) ? true : false, Validators.required],
        'suspendedDate': [task.suspendDate],
      }, {validator: this.finishTimeWithFinishDate}),
      'repeat': this.fb.group({
        'repeatDefault': [repeat.repeatDefault],
        'repeatDelta': [repeat.repeatDelta],
        'repeatCustom': [repeat.repeatCustom],
        'fromRepeating': [task.fromRepeating]
      }),
      'tags': this.fb.group({
        'tags': [''],
      }),
      'steps': this.initSteps(task.steps)
    });
  }

  private finishTimeWithFinishDate(group: any) {
    //let oldPassword = group.controls.oldPassword;
    //let newPassword = group.controls.newPassword;
    //let confirmNewPassword = group.controls.confirmNewPassword;
    let result = null;
    //if (newPassword.value !== confirmNewPassword.value) {
    //  result = {
    //    mismatchedPasswords: true
    //  };
    //}
    //if (oldPassword.value === newPassword.value) {
    //  result = {
    //    oldSameNew: true
    //  };
    //}
    return result;
  }

  clearFinishDate() {
    const main = <FormGroup>this.taskForm.controls['main'];
    main.controls['finishDate'].setValue('');
    this.finishDateViewChild.overlayVisible = false;
  }

  clearFinishTime() {
    const main = <FormGroup>this.taskForm.controls['main'];
    main.controls['finishTime'].setValue('');
    this.finishTimeViewChild.overlayVisible = false;
  }


  createNewTask(selectedProject: Project) {
    let defaultTypeFinishDate = 1;
    const finishDateOption = this.defaultFinishDateOptions
      .find((defaultFinishDateOption) => defaultFinishDateOption.id === selectedProject.defaultFinishDate);
    const isTypeFinishDateOptionsDefined = this.typeFinishDateOptions
        .some(typeFinishDateOption => typeFinishDateOption.id === selectedProject.defaultTypeFinishDate);

    if (isTypeFinishDateOptionsDefined) {
      defaultTypeFinishDate = selectedProject.defaultTypeFinishDate;
    }
    const task = new Task({
      'name': '',
      'priority': selectedProject.defaultPriority,
      'description': '',
      'type_finish_date': defaultTypeFinishDate,
      'finish_date': '',
      'suspended': false,
      'suspendedDate': '',
      'repeat': 0,
      'owner': this.user.toApi(),
      'author': this.user.toApi(),
      'repeat_delta': 1,
      'from_repeating': 0,
      'task_project': selectedProject.toApi(),
      'estimateTime': '',
      'time': '',
      'steps': [],
      'tags': [],
      'status': 0,
      'is_active': true,
      'percentage': 0,
      'pinned': false
    });

    if (finishDateOption) {
      if (finishDateOption.name === 'today') {
        task.moveFinishDateFromPreviousFinishDate('today');
      } else if (finishDateOption.name === 'tomorrow') {
        task.moveFinishDateFromPreviousFinishDate(1);
      } else if (finishDateOption.name === 'next week') {
        task.moveFinishDateFromPreviousFinishDate(7);
      }
    }

    return task;
  }

  changeActiveItemInMenu(menu_item) {
    // DRY
    for (let key in this.menu) {
      this.menu[key] = false;
    }
    this.menu[menu_item] = true;
  };

  checkActiveItemInMenu(menu_item) {
    // DRY
    return this.menu[menu_item];
  };

  addingTag(newTag) {
    if (this.tagsCtrl.valid) {

      if (newTag instanceof MatAutocompleteSelectedEvent) {
        if (newTag.option.value) {
          this.task.tags.push(newTag.option.value);
        }
      } else {
        const existingTag = this.tags.filter((t: Tag) => t.name === this.tagsCtrl.value)[0];
        if (existingTag) {
          this.task.tags.push(existingTag);
        } else {
          this.tagService.createTagDuringEditingTask(new Tag({name: this.tagsCtrl.value})).subscribe((t) => {
            this.task.tags.push(t);
          });
        }
      }
    } else {
      this.tagsCtrl.markAsDirty();
    }
    this.trigger.closePanel();
    this.tagsCtrl.reset();
    this.taskService.saveTask(this.task);
  }

  removeTagFromTask(tag) {
    this.task.removeTag(tag);
  }

  onSubmit($event, values, withoutClose = false) {
    if (this.taskForm.valid) {
      this.task.name = values['main']['name'];
      this.task.priority = values['main']['priority'];
      this.task.description = values['extra']['description'];
      this.task.finishDate = values['main']['finishDate'] ? moment(values['main']['finishDate'], 'DD-MM-YYYY') : '';
      this.task.suspendDate = values['extra']['suspendedDate'] ? moment(values['extra']['suspendedDate'], 'DD-MM-YYYY') : '';
      this.task.typeFinishDate = values['main']['typeFinishDate'];
      this.task.taskProject = this.projects.filter(project => project.id === parseInt(values['main']['taskProjectPk'], 10))[0];
      this.task.owner = <SimplyUser>this.task.taskProject.shareWith.filter(user => user['id'] === values['extra']['ownerId'])[0];

      if (values['repeat']['repeatDefault'] !== 99) {
        this.task.repeat = values['repeat']['repeatDefault'];
        this.task.repeatDelta = 1;
      } else {
        this.task.repeatDelta = values['repeat']['repeatDelta'];
        this.task.repeat = values['repeat']['repeatCustom'];
      }
      if (values['extra']['suspended']) {
        this.task.status = 2;
      }
      if (!values['extra']['suspended'] && this.task.status === 2) {
        this.task.status = 0;
      }

      this.task.fromRepeating = values['repeat']['fromRepeating'];
      this.task.estimateTime = values['extra']['estimateTime'];
      this.task.time = values['extra']['time'];
      // We need to know which step will be deleted in the backend
      this.task.steps = this.task.steps.filter(step => step.delete);
      values['steps'].forEach((step, index) => {
        if (step.name !== '') {
          this.task.steps.push(new Step({'id': step.id, 'name': step.name, 'order': index, 'status': 0}));
        }
      });
      console.log(this.task.steps);
      this.taskService.saveTask(this.task);
      // @TODO adding tags
      if (!withoutClose) {
        this.close();
      }
    } else {
      this.taskForm.markAsTouched();
      Object.keys(this.taskForm.controls).forEach((controlName) => {
        this.taskForm.controls[controlName].markAsTouched();
        // Object.keys(<FormGroup>this.taskForm.controls[controlName].controls).forEach((cN) => {
        //   <FormGroup>this.taskForm.controls[controlName].controls[cN].markAsTouched();
        // })
      });
    }

  }

  close() {
    // DRY
    this.location.back();
  }

  getErrorMessage(field) {
    return field.hasError('max') ? 'Name is too long' : '';
  }

  initSteps(steps) {
    const array = [];
    steps.filter(step => !step.delete).forEach((step: Step) => {
      array.push(this.fb.group({
        'name': [step.name, Validators.required],
        'id': [step.id, Validators.required]
      }));
    });
    array.push(this.initStep());

    return this.fb.array(array);
  }

  initStep() {
    return this.fb.group({
      'name': [''],
      'id': ['']
    });
  }

  addNewStep() {
    const control = <FormArray>this.taskForm.controls['steps'];
    control.push(this.initStep());
  }

  removeStep(i: number) {
    const control = <FormArray>this.taskForm.controls['steps'];
    // delete steps from task model
    if (control.controls[i].value.hasOwnProperty('id')) {
      this.task.steps.map(step => {
        if (step.id === control.controls[i].value.id) {
          step.delete = true;
        }
      });
    }
    control.removeAt(i);
  }

  changeProjectInTask(event) {
    this.task.taskProject = this.projects.find((project) => project.id === event.value);
    const extra = <FormGroup>this.taskForm.controls['extra'];
    extra.controls['ownerId'].setValue(this.user.id);
  }

  createAndAddMore($event, values) {
    this.onSubmit($event, values, true);
    this.task = this.createNewTask(this.selectedProject);
    this.taskForm.reset();
    this.taskForm = this.createTaskForm(this.task);
  }

  updateImmediately($event, values) {
    if (this.task.id) {
      this.onSubmit($event, values, true);
    }

  }

  deleteTask() {
    const dialogRef = this.dialog.open(DeleteTaskConfirmationDialog);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.taskService.deleteTask(this.task);
        this.close();
      }
    });
  }

}

@Component({
  selector: 'delete-task-confirmation-dialog',
  template: `<h1 mat-dialog-title>Deleting task</h1>
  <div mat-dialog-content>If you want to delete this task, click Yes</div>
  <div mat-dialog-actions>
    <button mat-button (click)='dialogRef.close(true)'>Yes</button>
    <button mat-button (click)='dialogRef.close(false)'>No</button>
  </div>`,
})
export class DeleteTaskConfirmationDialog {
  constructor(public dialogRef: MatDialogRef<DeleteTaskConfirmationDialog>) {
  }
}
