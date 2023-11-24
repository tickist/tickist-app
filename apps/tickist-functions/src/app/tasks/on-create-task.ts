import * as functions from "firebase-functions";
import { Task } from "@data/tasks/models/tasks";
import { Notification } from "@data/notifications";
import { createNotification } from "../notifications/create-notification";

export const createTaskNotification = functions.firestore.document("tasks/{taskId}").onCreate(async (snap) => {
    const taskData = snap.data() as Task;
    if (taskData.author.id !== taskData.owner.id) {
        const description = `${taskData.author.username} assigned the following task to you (project: ${taskData.taskProject.name})`;
        const title = `New task ${taskData.name}`;
        await createNotification({
            title,
            description,
            recipient: taskData.owner.id,
            type: "changesTaskFromSharedListThatIsAssignedToMe",
        } as Notification);
    }
});
