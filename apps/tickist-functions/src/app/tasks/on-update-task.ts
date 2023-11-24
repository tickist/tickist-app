import * as functions from "firebase-functions";
import { Task } from "@data/tasks/models/tasks";
import * as diff from "recursive-diff";
import { createNotification } from "../notifications/create-notification";
import { Notification } from "@data/notifications";

export const onUpdateTask = functions.firestore.document("tasks/{taskId}").onUpdate(async (change) => {
    console.log("Running onUpdateTask trigger ...");
    const before = change.before;
    const after = change.after;
    const beforeData = <Task>before.data();
    const afterData = <Task>after.data();

    const timeStamp = new Date().toISOString();
    const taskHistoryRef = change.after.ref.collection("history").doc(timeStamp);
    const diffObject = diff.getDiff(beforeData, afterData);
    await taskHistoryRef.set({ beforeData: beforeData, diff: JSON.parse(JSON.stringify(diffObject)) });
});

export const createUpdateTaskNotifications = functions.firestore.document("tasks/{taskId}").onUpdate(async (change) => {
    console.log("Running onUpdateTask trigger ...");
    const before = change.before;
    const after = change.after;
    if (before.isEqual(after)) return;
    const beforeData = before.data() as Task;
    const afterData = after.data() as Task;
    const editor = afterData.lastEditor;
    if (beforeData.isDone === false && afterData.isDone === true) {
        const title = `Completed task`;
        const description = `${editor.username} completed the task ${afterData.name} from ${afterData.taskProject.name}:`;
        for (const userId of afterData.taskProject.shareWithIds) {
            if (userId !== editor.id) {
                await createNotification({
                    title,
                    description,
                    recipient: userId,
                    type: "completesTaskFromSharedList",
                } as Notification);
            }
        }
    }

    if (editor?.id === afterData.author.id && afterData.author.id !== afterData.owner.id) {
        const title = `Change assigned to`;
        const description = `${editor.username} changed the task ${afterData.name} assigned to you`;
        await createNotification({
            title,
            description,
            recipient: afterData.owner.id,
            type: "changesTaskFromSharedListThatIsAssignedToMe",
        } as Notification);
    } else if (editor?.id === afterData.owner.id && afterData.author.id !== afterData.owner.id) {
        const title = ``;
        const description = `${editor.username} changed the task ${afterData.name}
            that you’d assigned to ${afterData.owner.username}`;
        await createNotification({
            title,
            description,
            recipient: afterData.author.id,
            type: "changesTaskFromSharedListThatIAssignedToHimHer",
        } as Notification);
    } else if (afterData.author.id !== afterData.owner.id && afterData.owner.id !== editor?.id && afterData.author.id !== editor?.id) {
        const title = ``;
        const description = `${editor.username} changed the task ${afterData.name}`;
        await createNotification({
            title,
            description,
            recipient: afterData.owner.id,
            type: "changesTaskFromSharedListThatIAssignedToHimHer",
        } as Notification);
        await createNotification({
            title,
            description,
            recipient: afterData.author.id,
            type: "changesTaskFromSharedListThatIAssignedToHimHer",
        } as Notification);
    }
});
