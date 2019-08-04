import * as functions from 'firebase-functions';
import {db} from '../init';
import * as admin from 'firebase-admin';
import {ShareWithUser} from '@tickist/models/projects/share-with-user';
import {Tag} from '@tickist/models/tags';
import {Task} from '@tickist/models/tasks/tasks';



export const onCreateUser = functions.firestore.document('users/{userId}')
    .onCreate(async (snap, context) => {
        const userId = context.params.userId;
        console.log('Running createUser trigger ...');

        return db.runTransaction(async transaction => {
            const tagsNamesIds = [];
            const projectRef = db.collection('projects').doc();
            console.log(projectRef.id);
            transaction.set(projectRef, {id: projectRef.id, ...createInboxProject(snap.data(), userId)});
            defaultTagsName().forEach(tagName => {
                const tagRef = db.collection('tags').doc();
                transaction.set(tagRef, {...createTag(tagName, userId)});
                tagsNamesIds.push({tagName: tagRef.id});
            });
            transaction.update(snap.ref, {inboxPk: projectRef.id});
            // createTask('Find out more about Tickist')
            // createTask('Find out more about editing tasks)
            // transaction.update(courseRef, changes);

        });

    });


function createInboxProject(userData, userId) {
    return {name: 'Inbox', isInbox: true, owner: userId,
        shareWith: [<ShareWithUser> {id: userId, username: userData.username, email: userData.email, avatarUrl: userData.avatarUrl}],
        shareWithIds: [userId]
    };
}

function createTag(tagName, userId) {
    return {name: tagName, author: userId};
}

function defaultTagsName () {
    return [
       'work', 'home', 'need focus', 'someday/maybe', 'tasks for later', 'quick tasks', 'getting to know Tickist'
    ];
}

// function createTask(name, user, project) {
//     return new Task({
//         name: name,
//         owner: user,
//         author: user,
//         taskProject: {'id': project.id, name: project.name}
//     });
// }
// @receiver(post_save, sender=User)
// @disable_for_loaddata
// def creating_inbox_tasks_tags_after_user_save(sender, instance, created, *args, **kwargs):
// if created:
// from django.utils.translation import ugettext as _
// from dashboard.tasks.models import Task,
// import {ShareWithUser} from '../../../src/app/models/projects/share-with-user'; Tag
// for name in [_("work"), _("home"), _("need focus"), _("someday/maybe"), _("tasks for later"),
//     _('quick tasks'), _('getting to know Tickist')]:
// try:
// Tag.objects.get(name=name, author=instance)
// except Tag.DoesNotExist:
// Tag(name=name, author=instance).save()
// list_name = _("Inbox")
// try:
// project = List.objects.get(name=list_name, owner=instance)
// except List.DoesNotExist:
// project = List()
// project.name = list_name
// project.owner = instance
// project.is_inbox = True
// project.save()
// project.share_with.add(instance)
// task1 = Task()
// task1.name = ('Find out more about Tickist')
// task1.author = instance
// task1.owner = instance
// task1.finish_date = datetime.datetime.now().strftime('%Y-%m-%d')
// task1.task_list = project
// task1.estimate_time = 5
// task1.save()
// task1.tags.add(Tag.objects.get(name = _('getting to know Tickist'), author=instance))
// task1.tags.add(Tag.objects.get(name = _('quick tasks'), author=instance))
//
// task2 = Task()
// task2.name = ('Find out more about editing tasks')
// task2.author = instance
// task2.owner = instance
// task2.task_list = project
// task2.finish_date = datetime.datetime.now().strftime('%Y-%m-%d')
// task2.estimate_time = 5
// task2.save()
// task2.tags.add(Tag.objects.get(name=_('getting to know Tickist'), author=instance))
// task2.tags.add(Tag.objects.get(name=_('quick tasks'), author=instance))
//
