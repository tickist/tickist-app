import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {Project} from '../models/projects';
import {ProjectService} from '../services/projectService';
import {Location} from '@angular/common';
import {FormBuilder, FormGroup, Validators, FormControl, FormArray} from '@angular/forms';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import {Subscription} from 'rxjs/Subscription';
import {ConfigurationService} from '../services/configurationService';
import {ActivatedRoute, Router} from '@angular/router';
import {User, SimplyUser, PendingUser} from '../models/user';
import {UserService} from '../services/userService';
import {MatDialog} from '@angular/material';
import {environment} from '../../environments/environment';
import {DeleteProjectConfirmationDialogComponent} from './delete-project-dialog/delete-project-dialog.component';
import * as _ from 'lodash';


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
    team: SimplyUser[];
    defaultTaskView: any;
    typeFinishDateOptions: any;
    defaultFinishDateOptions: any;
    deleteOrLeaveProjectLabel = '';
    colors: any;
    staticUrl: string;
    filteredUsers: any;
    addUserToShareWithListCtrl: FormControl;
    subscription: Subscription;

    @ViewChild('auto') auto: any;
    @ViewChild('matAutocomplete') matAutocomplete: any;

    constructor(private fb: FormBuilder, private userService: UserService, private route: ActivatedRoute,
                private projectService: ProjectService, private location: Location, public dialog: MatDialog,
                private configurationService: ConfigurationService, protected router: Router) {

        this.staticUrl = environment['staticUrl'];
        this.addUserToShareWithListCtrl = new FormControl();
        this.menu = this.createMenuDict();
        this.typeFinishDateOptions = this.configurationService.configuration['commons']['TYPE_FINISH_DATE_OPTIONS'];
        this.defaultFinishDateOptions = this.configurationService.configuration['commons']['CHOICES_DEFAULT_FINISH_DATE'];
        this.defaultTaskView = this.configurationService.configuration['commons']['DEFAULT_TASK_VIEW_OPTIONS'];
        this.colors = this.configurationService.configuration['commons']['COLOR_LIST'];
        this.stream$ = Observable
            .combineLatest(
                projectService.projects$,
                this.route.params.map(params => parseInt(params['projectId'], 10)),
                this.userService.user$,
                this.userService.team$,
                (projects: Project[], projectId, user: User, team: SimplyUser[]) => {
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
                        return project;
                    }
                }
            );
        this.subscription = this.stream$.subscribe(project => {
            this.project = project;

        });
        this.addUserToShareWithListCtrl = new FormControl('',
            Validators.compose([Validators.required, Validators.email]));
        this.filteredUsers = this.addUserToShareWithListCtrl.valueChanges
            .startWith(null)
            .map(name => this.filterUsers(name));
    }

    ngOnInit() {
        this.configurationService.changeOpenStateLeftSidenavVisibility('close');
        this.configurationService.changeOpenStateRightSidenavVisibility('close');
        this.configurationService.updateAddTaskComponentVisibility(false);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.configurationService.updateLeftSidenavVisibility();
        this.configurationService.updateRightSidenavVisibility();
        this.configurationService.updateAddTaskComponentVisibility(true);
    }

    createMenuDict() {
        return {
            'main': true, 'extra': false, 'sharing': false
        };
    }

    changeActiveItemInMenu(menu_item) {
        // DRY
        for (const key in this.menu) {
            this.menu[key] = false;
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
        this.projectService.saveProject(this.project);
        this.close();
    }

    close() {
        // DRY
        this.location.back();
    }

    createForm(project: Project) {
        return this.fb.group({
            'main': this.fb.group({
                'name': [project.name, Validators.required],
                'ancestor': [project.ancestor],
                'color': [project.color],
                'description': [project.description]
            }),
            'extra': this.fb.group({
                'defaultFinishDate': [project.defaultFinishDate],
                'defaultPriority': [project.defaultPriority],
                'defaultTypeFinishDate': [project.defaultTypeFinishDate],
                'dialogTimeWhenTaskFinished': [project.dialogTimeWhenTaskFinished],
                'taskView': [project.taskView]
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
            'dialogTimeWhenTaskFinished': this.user.dialogTimeWhenTaskFinishedInProject
        });
    }

    deleteUserFromShareWithList(user: (SimplyUser | PendingUser), i: number) {
        const title = 'Confirmatiom';
        const content = `If you are sure you want to remove  ${user.username} from the shared list ${this.project.name},
                          click Yes. All tasks assigned to this person will be moved to her/his Inbox.`;

        const dialogRef = this.dialog.open(DeleteProjectConfirmationDialogComponent);
        dialogRef.componentInstance.setTitle(title);
        dialogRef.componentInstance.setContent(content);
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const control = <FormArray>this.projectForm.controls['sharing'];
                if (control.controls[i].value.hasOwnProperty('id')) {
                    this.project.shareWith.filter((u: SimplyUser | PendingUser) => {
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
                return [...this.team.filter(u => userIds.indexOf(u['id']) > -1).filter(u => new RegExp(val, 'gi').test(u.email)), {'email': val}];
            }
        }
        return [];

    }

    inviteUser() {
        if (this.addUserToShareWithListCtrl.valid) {
            this.userService.checkNewTeamMember(this.addUserToShareWithListCtrl.value).subscribe((user) => {
                this.project.addUserToShareList(user);
            });
        } else {
            this.addUserToShareWithListCtrl.markAsDirty();
        }

    }

}


