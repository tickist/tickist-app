import {Component, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Project, ShareWithPendingUser, ShareWithUser} from '../../../../models/projects';
import {Location} from '@angular/common';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {combineLatest, Observable, Subject, Subscription} from 'rxjs';
import {ConfigurationService} from '../../../../services/configuration.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SimpleUser, User} from '../../../../core/models';
import {UserService} from '../../../../core/services/user.service';
import {MatDialog} from '@angular/material/dialog';
import {environment} from '../../../../../environments/environment';
import {map, startWith, takeUntil} from 'rxjs/operators';
import {RequestCreateProject, UpdateProject} from '../../../../core/actions/projects/projects.actions';
import {Store} from '@ngrx/store';
import {AppStore} from '../../../../store';
import {selectAllProjects} from '../../../../core/selectors/projects.selectors';
import {selectLoggedInUser} from '../../../../core/selectors/user.selectors';
import {selectTeam} from '../../../../core/selectors/team.selectors';
import {addUserToShareList} from '../../../../core/utils/projects-utils';
import {convert} from '../../../../core/utils/addClickableLinksToString';
import {HideAddTaskButton, ShowAddTaskButton} from '../../../../core/actions/add-task-button-visibility.actions';
import {DeleteUserConfirmationDialogComponent} from '../../components/delete-user-confirmation-dialog/delete-user-confirmation-dialog.component';


@Component({
    selector: 'tickist-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit, OnDestroy {
    ENTER = 'Enter';
    project: Project;
    ancestorProjectId: number;
    defaultAvatarUrl: string;
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

    @ViewChild('auto', {static: false}) auto: any;
    @ViewChild('matAutocomplete', {static: false}) matAutocomplete: any;

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
        this.defaultAvatarUrl = this.configurationService.configuration['commons']['DEFAULT_USER_AVATAR_URL'];
        this.route.params.pipe(
            takeUntil(this.ngUnsubscribe),
            map(params => params['ancestorProjectId'])
        )
            .subscribe(ancestorProjectId => {
                this.ancestorProjectId = ancestorProjectId;
            });
        this.stream$ = combineLatest(
            this.store.select(selectAllProjects),
            this.route.params.pipe(map(params => params['projectId'])),
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
        this.store.dispatch(new HideAddTaskButton());

    }

    ngOnDestroy() {
        this.store.dispatch(new ShowAddTaskButton());
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

    @HostListener('window:keyup', ['$event'])
    keyEvent(event: KeyboardEvent) {
        if (event.key === this.ENTER && this.checkActiveItemInMenu('sharing')) {
            this.inviteUser();
        }
    }

    onSubmit(values) {
        if (this.projectForm.valid) {
            const project = Object.assign({}, this.project);
            project.name = values['main']['name'];
            project.description = values['main']['description'];
            project.richDescription = convert(values['main']['description']);
            project.ancestor = values['main']['ancestor'];
            project.color = values['main']['color'];
            project.defaultFinishDate = values['extra']['defaultFinishDate'];
            project.defaultPriority = values['extra']['defaultPriority'];
            project.defaultTypeFinishDate = values['extra']['defaultTypeFinishDate'];
            project.defaultTypeFinishDate = values['extra']['defaultTypeFinishDate'];
            project.taskView = values['extra']['taskView'];
            project.dialogTimeWhenTaskFinished = values['extra']['dialogTimeWhenTaskFinished'];
            // @TODO maybe whole object instead of ID

            // if (project.ancestor) {
            //     this.updateAncestorProject(project.ancestor);
            // }
            // List share with is added directly
            if (this.isNewProject()) {
                this.store.dispatch(new RequestCreateProject({project: project}));
            } else {
                this.store.dispatch(new UpdateProject({project: {id: project.id, changes: project}}));
            }

            this.close();
        }
    }

    close() {
        // DRY
        this.location.back();
    }

    // updateAncestorProject(ancestorProjectId) {
    //     const ancestorProject = this.projectsAncestors.find(project => project.id === ancestorProjectId);
    //
    // }

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
            'ancestor': this.ancestorProjectId ? this.ancestorProjectId : null,
            'color': this.configurationService.loadConfiguration()['commons']['COLOR_LIST_DEFAULT'],
            'defaultFinishDate': '',
            'defaultPriority': this.configurationService.loadConfiguration()['commons']['DEFAULT_PRIORITY_OF_TASK'],
            'defaultTypeFinishDate': this.configurationService.loadConfiguration()['commons']['DEFAULT_TYPE_FINISH_DATE'],
            'defaultTaskView': this.user.defaultTaskView,
            'owner': this.user.id,
            'isActive': true,
            'shareWith': [{id: this.user.id, email: this.user.email, username: this.user.username, avatarUrl: this.user.avatarUrl}],
            'shareWithIds': [this.user.id],
            'tags': [],
            'dialogTimeWhenTaskFinished': this.user.dialogTimeWhenTaskFinishedInProject,
            'isInbox': false
        });
    }

    deleteUserFromShareWithList(user: (ShareWithUser | ShareWithPendingUser | User), i: number) {
        const title = 'Confirmatiom';
        const content = `If you are sure you want to remove  ${user.username} from the shared list ${this.project.name},
                          click Yes. All tasks assigned to this person will be moved to her/his Inbox.`;

        const dialogRef = this.dialog.open(DeleteUserConfirmationDialogComponent);
        dialogRef.componentInstance.setTitle(title);
        dialogRef.componentInstance.setContent(content);
        dialogRef.afterClosed().pipe(takeUntil(this.ngUnsubscribe)).subscribe(result => {
            if (result) {
                const control = <FormArray>this.projectForm.controls['sharing'];
                if (control.controls[i].value.hasOwnProperty('id')) {
                    this.project.shareWith.filter((u: ShareWithUser | ShareWithPendingUser) => {
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
                    .filter(u => !userIds.includes(u.id))
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
                    this.project = <Project>addUserToShareList(this.project, user);
                    this.addUserToShareWithListCtrl.reset();
                });
        } else {
            this.addUserToShareWithListCtrl.markAsDirty();
        }

    }

    isNewProject(): boolean {
        return !this.project.id;
    }

}


