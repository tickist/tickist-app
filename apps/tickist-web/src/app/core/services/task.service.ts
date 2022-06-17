import { Observable } from "rxjs";
import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { environment } from "../../../environments/environment";
import { AppStore } from "../../store";
import { Task } from "@data/tasks/models/tasks";
import { selectAllTasks } from "../selectors/task.selectors";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { setStatusDoneLogic } from "../../single-task/utils/set-status-to-done-logic";
import { Editor, User } from "@data/users";
import {
    Firestore,
    doc,
    onSnapshot,
    DocumentReference,
    docSnapshots,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    collection,
} from "@angular/fire/firestore";
const tasksCollectionName = "tasks";

@Injectable({
    providedIn: "root",
})
export class TaskService {
    tasks$: Observable<Task[]>;

    constructor(private firestore: Firestore, private store: Store) {
        this.tasks$ = this.store.select(selectAllTasks);
    }

    postponeToToday() {
        // this.http.post<Task[]>(`${environment['apiUrl']}/tasks/move_tasks_for_today/`, {}).subscribe((tasks: Task[]) => {
        // });
    }

    async createTask(task: Task, user: User) {
        const docRef = doc(collection(this.firestore, tasksCollectionName));
        const editor = {
            id: user.id,
            email: user.email,
            username: user.username,
        } as Editor;

        await setDoc(docRef, JSON.parse(JSON.stringify({ ...task, lastEditor: editor, id: docRef.id })));
    }

    async updateTask(task: Task, user: User) {
        const editor = {
            id: user.id,
            email: user.email,
            username: user.username,
        } as Editor;
        const taskWithLastEditor = { ...task, lastEditor: editor };

        const docRef = doc(this.firestore, `${tasksCollectionName}/${task.id}`);
        await updateDoc(docRef, JSON.parse(JSON.stringify(taskWithLastEditor)));
    }

    setStatusDone(task: Task, user: User) {
        return this.updateTask(setStatusDoneLogic(task), user);
    }

    async deleteTask(taskId: string) {
        const docRef = doc(this.firestore, `${tasksCollectionName}/${taskId}`);
        await updateDoc(docRef, { isActive: false });
        //
        // return this.db
        //     .collection(tasksCollectionName)
        //     .doc(taskId)
        //     .update({ isActive: false });
    }
}
