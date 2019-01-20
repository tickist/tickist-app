import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {Project} from '../../models/projects';
import {ProjectService} from '../../services/project.service';
import {Location} from '@angular/common';
import {FormBuilder, FormGroup, Validators, FormControl, FormArray} from '@angular/forms';
import {Observable, Subscription, combineLatest, Subject} from 'rxjs';
import {ConfigurationService} from '../../services/configuration.service';
import {ActivatedRoute, Router} from '@angular/router';
import {User, SimpleUser, PendingUser} from '../../user/models';
import {UserService} from '../../user/user.service';
import {MatDialog} from '@angular/material';
import {environment} from '../../../environments/environment';
import {DeleteProjectConfirmationDialogComponent} from '../delete-project-dialog/delete-project-dialog.component';
import {map, startWith, takeUntil} from 'rxjs/operators';
import {RequestCreateProject, UpdateProject} from '../projects.actions';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {selectAllProjects, selectAllProjectsL0L1} from '../projects.selectors';
import {selectLoggedInUser} from '../../user/user.selectors';
import {selectTeam} from '../../user/team.selectors';


@Component({
    selector: 'app-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit, OnDestroy {
    project: Project;
    projectsAncestors: Project[] | any[];
    stream$: Observable<any>;
    projectForm: FormGroup;
    menu: {};
    user: User;
    team: SimpleUser[];
    defaultTaskView: any;
    typeFinishDateOptions: any;
    defaultFinishDateOptions: any;
    deleteOrLeaveProjectLabel = '';
    colors: any;
    staticUrl: string;
    filteredUsers: any;
    addUserToShareWithListCtrl: FormControl;
    subscription: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    @ViewChild('auto') auto: any;
    @ViewChild('matAutocomplete') matAutocomplete: any;

    constructor(private fb: FormBuilder, private userService: UserService, private route: ActivatedRoute,
                private store: Store<AppStore>, private location: Location, public dialog: MatDialog,
                private configurationService: ConfigurationService, protected router: Router) {

        this.staticUrl = environment['staticUrl'];
        this.addUserToShareWithListCtrl = new FormControl();
        this.menu = this.createMenuDict();

    }

    ngOnInit() {
        this.typeFinishDateOptions = this.configurationService.configuration['commons']['TYPE_FINISH_DATE_OPTIONS'];
        this.defaultFinishDateOptions = this.configurationService.configuration['commons']['CHOICES_DEFAULT_FINISH_DATE'];
        this.defaultTaskView = this.configurationService.configuration['commons']['DEFAULT_TASK_VIEW_OPTIONS'];
        this.colors = this.configurationService.configuration['commons']['COLOR_LIST'];
        this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        this.configurationService.changeOpenStateRightSidenavVisibility('close');
        this.configurationService.updateAddTaskComponentVisibility(false);

        this.stream$ = combineLatest(
            this.store.select(selectAllProjects),
            this.route.params.pipe(map(params => parseInt(params['projectId'], 10))),
            this.store.select(selectLoggedInUser),
            this.store.select(selectTeam)
        );
        this.subscription = this.stream$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(([projects, projectId, user, team]) => {
            let project: Project;
            this.user = user;
            this.team = team;
            if (projects.length > 0 && user) {
                this.projectsAncestors = [{id: '', name: ''},
                    ...projects.filter(p => p.level < 2).filter(p => p.id !== projectId)];
                if (projectId) {
                    project = projects.find(p => p.id === projectId);
                    this.projectForm = this.createForm(project);
                } else {
                    project = this.createNewProject();
                    this.projectForm = this.createForm(project);
                }
                if (this.user.id === project.owner) {
                    this.deleteOrLeaveProjectLabel = 'Delete project';

                } else {
                    this.deleteOrLeaveProjectLabel = 'Leave project';
                }
                this.project = project;
            }

        });
        this.addUserToShareWithListCtrl = new FormControl('',
            Validators.compose([Validators.required, Validators.email]));
        this.filteredUsers = this.addUserToShareWithListCtrl.valueChanges.pipe(
            startWith(null),
            map(name => this.filterUsers(name))
        );

    }

    ngOnDestroy() {
        this.configurationService.updateLeftSidenavVisibility();
        this.configurationService.updateRightSidenavVisibility();
        this.configurationService.updateAddTaskComponentVisibility(true);
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    createMenuDict() {
        return {
            'main': true, 'extra': false, 'sharing': false
        };
    }

    changeActiveItemInMenu(menu_item) {
        // DRY
        for (const key in this.menu) {
            if (this.menu.hasOwnProperty(key)) {
                this.menu[key] = false;
            }
        }
        this.menu[menu_item] = true;
    }

    checkActiveItemInMenu(menu_item) {
        // DRY
        return this.menu[menu_item];
    }

    onSubmit(values) {
        this.project.name = values['main']['name'];
        this.project.description = values['main']['description'];
        this.project.ancestor = values['main']['ancestor'];
        this.project.color = values['main']['color'];
        this.project.defaultFinishDate = values['extra']['defaultFinishDate'];
        this.project.defaultPriority = values['extra']['defaultPriority'];
        this.project.defaultTypeFinishDate = values['extra']['defaultTypeFinishDate'];
        this.project.defaultTypeFinishDate = values['extra']['defaultTypeFinishDate'];
        this.project.taskView = values['extra']['taskView'];
        this.project.dialogTimeWhenTaskFinished = values['extra']['dialogTimeWhenTaskFinished'];

        // List share with is added directly
        if (this.isNewProject()) {
            this.store.dispatch(new RequestCreateProject({project: this.project}));
        } else {
            this.store.dispatch(new UpdateProject({project: {id: this.project.id, changes: this.project}}));
        }

        // this.projectService.saveProject(this.project);
        this.close();
    }

    close() {
        // DRY
        this.location.back();
    }

    createForm(project: Project) {
        return new FormGroup({
            'main': new FormGroup({
                'name': new FormControl(project.name, {validators: Validators.required}),
                'ancestor': new FormControl(project.ancestor),
                'color': new FormControl(project.color),
                'description': new FormControl(project.description)
            }),
            'extra': new FormGroup({
                'defaultFinishDate': new FormControl(project.defaultFinishDate),
                'defaultPriority': new FormControl(project.defaultPriority),
                'defaultTypeFinishDate': new FormControl(project.defaultTypeFinishDate),
                'dialogTimeWhenTaskFinished': new FormControl(project.dialogTimeWhenTaskFinished),
                'taskView': new FormControl(project.taskView)
            })
        });
    }

    createNewProject() {
        return new Project({
            'name': '',
            'description': '',
            'ancestor': null,
            'color': this.configurationService.loadConfiguration()['commons']['COLOR_LIST_DEFAULT'],
            'default_finish_date': '',
            'default_priority': this.configurationService.loadConfiguration()['commons']['DEFAULT_PRIORITY_OF_TASK'],
            'default_type_finish_date': this.configurationService.loadConfiguration()['commons']['DEFAULT_TYPE_FINISH_DATE'],
            'default_task_view': this.user.defaultTaskView,
            'owner': this.user.id,
            'is_active': true,
            'share_with': [],
            'tags': [],
            'dialog_time_when_task_finished': this.user.dialogTimeWhenTaskFinishedInProject,
            'is_inbox': false
        });
    }

    deleteUserFromShareWithList(user: (SimpleUser | PendingUser), i: number) {
        const title = 'Confirmatiom';
        const content = `If you are sure you want to remove  ${user.username} from the shared list ${this.project.name},
                          click Yes. All tasks assigned to this person will be moved to her/his Inbox.`;

        const dialogRef = this.dialog.open(DeleteProjectConfirmationDialogComponent);
        dialogRef.componentInstance.setTitle(title);
        dialogRef.componentInstance.setContent(content);
        dialogRef.afterClosed().pipe(takeUntil(this.ngUnsubscribe)).subscribe(result => {
            if (result) {
                const control = <FormArray>this.projectForm.controls['sharing'];
                if (control.controls[i].value.hasOwnProperty('id')) {
                    this.project.shareWith.filter((u: SimpleUser | PendingUser) => {
                        return (u.hasOwnProperty('id') && u['id'] === control.controls[i].value.id);
                    });
                }
                control.removeAt(i);
            }
        });

    }

    filterUsers(val): any {
        if (val) {
            const userIds = [];
            this.project.shareWith.forEach((u) => {
                if (u.hasOwnProperty('id')) {
                    userIds.push(u['id']);
                }
            });
            if (this.addUserToShareWithListCtrl.hasError('pattern') || this.addUserToShareWithListCtrl.hasError('required')) {
                return [{'id': '', 'email': 'Please write a valid email'}];
            } else {
                return [...this.team
                    .filter(u => userIds.indexOf(u['id']) > -1)
                    .filter(u => new RegExp(val, 'gi').test(u.email)), {'email': val}
                ];
            }
        }
        return [];

    }

    inviteUser() {
        if (this.addUserToShareWithListCtrl.valid) {
            this.userService.checkNewTeamMember(this.addUserToShareWithListCtrl.value)
                .pipe(takeUntil(this.ngUnsubscribe))
                .subscribe((user) => {
                    this.project.addUserToShareList(user);
                });
        } else {
            this.addUserToShareWithListCtrl.markAsDirty();
        }

    }

    isNewProject(): boolean {
        return !Number.isInteger(this.project.id);
    }

}


