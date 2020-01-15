import {User} from '@data/users/models';
import {Project, ShareWithUser} from '@data/projects';
import {Tag} from '@data/tags/models/tags';
import {Task} from '@data/tasks/models/tasks';
import {addDays} from 'date-fns';

export class Database {
    projectsNames = ['Project 1', 'Project 2', 'Project 3'];
    uid: string;
    user: User;
    inbox: Project;
    projects: Project[] = [];
    tags: Tag[] = [];
    tasks: Task[] = [];

    constructor(uid) {
        this.uid = uid;
        console.log(uid);
        this.createUser();
        this.createInbox();
        this.createProjects();
        this.createTags();
        this.createTasks();
    }

    getUserUid() {
        return this.uid;
    }

    getUserObject() {
        return this.user;
    }

    createUser() {
        this.user = new User(<any>{id: this.uid, username: 'Bill Doe', email: 'john@tickist.com'});
    }

    createInbox() {
        this.inbox = new Project({
            id: '1', name: 'Inbox', isInbox: true, owner: this.uid,
            shareWith: [<ShareWithUser>{
                id: this.uid,
                username: this.user.username,
                email: this.user.email,
                avatarUrl: this.user.avatarUrl
            }],
            shareWithIds: [this.uid]
        });
        this.user.inboxPk = this.inbox.id;
    }

    createProjects() {
        const projectsName = ['Project 1', 'Project 2'];
        projectsName.forEach((projectName, index) => {
            this.projects.push(new Project({
                id: (index + 101).toString(), name: projectName, owner: this.uid,
                shareWith: [<ShareWithUser>{
                    id: this.uid,
                    username: this.user.username,
                    email: this.user.email,
                    avatarUrl: this.user.avatarUrl
                }],
                shareWithIds: [this.uid]
            }));
        });
    }

    createTags() {
        const tagsName = [
            'tag 1', 'tag 2', 'tag 3', 'tag 4', 'tag 5', 'tag 6'
        ];
        tagsName.forEach((tagName, index) => {
            this.tags.push(new Tag({id: (index + 1).toString(), name: tagName, author: this.uid}));
        });

    }

    createTasks() {
        const tasksData = [
            {'name': 'Task 1', project: this.projects[0], tags: [this.tags[0], this.tags[1]], finishDate: new Date()},
            {'name': 'Task 2', project: this.projects[0], tags: [this.tags[0], this.tags[1]], finishDate: addDays(new Date(), -1)},
            {'name': 'Task 3', project: this.projects[1], tags: [], finishDate: addDays(new Date(), 1)},
            {'name': 'Task 4', project: this.projects[1], tags: [this.tags[4], this.tags[5]], finishDate: undefined},
        ];
        tasksData.forEach((taskData, index) => {
            this.tasks.push(this.createTask({...taskData, id:index}));
        });
    }

    private createTask({name, project, tags, finishDate, id}) {
        return new Task({
            id: (id + 1).toString(),
            name: name,
            owner: this.user,
            ownerPk: this.uid,
            priority: project.defaultPriority,
            author: this.user,
            taskListPk: project.id,
            tags: tags,
            finishDate: finishDate,
            tagsIds: tags.map(tag => tag.id),
            taskProject: {'id': project.id, name: project.name, color: project.color, shareWithIds: project.shareWithIds}
        });
    }
}
