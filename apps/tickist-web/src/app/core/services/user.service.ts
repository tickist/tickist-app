import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Store } from "@ngrx/store";
import { User } from "@data/users/models";
import { TasksFiltersService } from "./tasks-filters.service";
import { selectLoggedInUser } from "../selectors/user.selectors";
import { Auth, confirmPasswordReset, sendPasswordResetEmail } from "@angular/fire/auth";
import { ref, Storage, uploadBytesResumable } from "@angular/fire/storage";
import { USER_AVATAR_PATH } from "@data/users/config-user";
import { NotificationPermission } from "@data";
import { doc, Firestore, updateDoc } from "@angular/fire/firestore";

const userCollectionName = "users";

@Injectable({
    providedIn: "root",
})
export class UserService {
    user$: Observable<User>;
    downloadURL: Observable<string>;

    constructor(
        private store: Store,
        private firestore: Firestore,
        private storage: Storage,
        private tasksFiltersService: TasksFiltersService,
        private authFire: Auth,
    ) {
        this.user$ = this.store.select(selectLoggedInUser);
    }

    async updateUser(user: User) {
        const docRef = doc(this.firestore, `${userCollectionName}/${user.id}`);
        await updateDoc(docRef, JSON.parse(JSON.stringify(user)));

        // return this.db
        //     .collection(userCollectionName)
        //     .doc(user.id)
        //     .update(JSON.parse(JSON.stringify(user)));
    }

    requestChangePassword(email: string) {
        return sendPasswordResetEmail(this.authFire, email).then(
            () => {
                // success, show some message
            },
            () => {
                // handle errors
            },
        );
    }

    changePassword(password: string, code: string) {
        return confirmPasswordReset(this.authFire, code, password);
    }

    async savefcmToken(token, user) {
        const docRef = doc(this.firestore, `${userCollectionName}/${user.id}`);
        await updateDoc(docRef, {
            fcmToken: token,
            notificationPermission: NotificationPermission.yes,
        });

        // return this.db.collection(userCollectionName).doc(user.id).update({
        //     fcmToken: token,
        //     notificationPermission: NotificationPermission.yes,
        // });
    }

    changeUserAvatar(avatar: File, user: User) {
        const avatarPath = USER_AVATAR_PATH + user.id + "/" + avatar.name;
        const storageRef = ref(this.storage, avatarPath);
        // const fileRef = this.storage.ref(avatarPath);
        // const task = this.storage.upload(avatarPath, avatar);
        const uploadTask = uploadBytesResumable(storageRef, avatar);
        // observe percentage changes
        //  this.uploadPercent = task.percentageChanges();
        // get notified when the download URL is available
        return uploadTask;
        //     .on("state_changed", (snapshot) => {
        //
        //     })
        //     .pipe(
        //         finalize(async () => {
        //             this.downloadURL = await fileRef
        //                 .getDownloadURL()
        //                 .toPromise();
        //             this.store.dispatch(
        //                 changeAvatar({ avatarUrl: avatar.name })
        //             );
        //         })
        //     )
        //     .subscribe();
        //
        // return task.percentageChanges();
    }
}
