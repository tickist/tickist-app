import {SimplyUser, PendingUser} from './user';
import * as _ from 'lodash';
import {Api} from './commons';

export class Project extends Api {
  id: number;
  name: string;
  isActive: boolean;
  isInbox: boolean;
  description: string;
  ancestor: Project;
  color: string;
  tasksCounter: number;
  allDescendants: any;
  shareWith: (SimplyUser | PendingUser)[] = [];
  level: number;
  owner: number;
  defaultFinishDate: any;
  defaultPriority: any;
  defaultTypeFinishDate: any;
  dialogTimeWhenTaskFinished: boolean;
  defaultTaskView: string;

  constructor(project) {
    super();
    this.name = project.name;
    this.id = project.id || undefined;
    this.ancestor = project.ancestor || undefined;
    this.color = project.color || undefined;
    this.tasksCounter = !(isNaN(project.tasks_counter)) ? project.tasks_counter :  undefined;
    this.allDescendants = project.get_all_descendants;
    this.defaultFinishDate = project.default_finish_date;
    this.defaultPriority = project.default_priority;
    this.defaultTypeFinishDate = project.default_type_finish_date;
    this.owner = project.owner;
    this.level = project.level;
    this.isActive = project.is_active;
    this.defaultTaskView = project.task_view || 'extended';
    this.dialogTimeWhenTaskFinished = project.dialog_time_when_task_finished || true;
    this.isInbox = project.is_inbox;
    if (!project.share_with) {
      debugger
    }
    project.share_with.forEach((user) => {
      this.addUserToShareList(user);

    })
  }
  addUserToShareList(user) {
    if (user.hasOwnProperty('id')) {
      this.shareWith.push(new SimplyUser(user));
    } else {
      this.shareWith.push(new PendingUser(user));
    }
  }
}

export class SimpleProject extends Api {
  id: number;
  name: string;
  color: string;

  constructor(project) {
    super();
    this.id = project.id;
    this.name = project.name;
    this.color = project.color;
  }
}
