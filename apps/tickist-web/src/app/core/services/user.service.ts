import * as _ from 'lodash';
import {Injectable} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {SimpleUser, User} from '@data/users/models';
import {TasksFiltersService} from './tasks-filters.service';
import {selectLoggedInUser} from '../selectors/user.selectors';
import {Logout} from '../actions/auth.actions';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {filter, finalize, map} from 'rxjs/operators';
import {AngularFireStorage} from '@angular/fire/storage';
import {changeAvatar} from '../actions/user.actions';
import {USER_AVATAR_PATH} from '@data/users/config-user';
import {ShareWithUser} from '@data/projects';

const userCollectionName = 'users';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    user$: Observable<User>;
    downloadURL: Observable<string>;

    constructor(private store: Store<{}>, private db: AngularFirestore, private storage: AngularFireStorage,
                private tasksFiltersService: TasksFiltersService, private authFire: AngularFireAuth) {
        this.user$ = this.store.select(selectLoggedInUser);
    }

    updateUser(user: User) {
        return this.db.collection(userCollectionName)
            .doc(this.authFire.auth.currentUser.uid)
            .update(JSON.parse(JSON.stringify(user)));
    }

    changePassword(values: any) {
        // @TODO
        console.log(this.authFire);
    }

    savefcmToken(token) {
        return this.db.collection(userCollectionName)
            .doc(this.authFire.auth.currentUser.uid)
            .update({fcmToken: token});
    }

    changeUserAvatar(avatar: File, user: User) {
        const avatarPath = USER_AVATAR_PATH + user.id + '/' + avatar.name;
        const fileRef = this.storage.ref(avatarPath);
        const task = this.storage.upload(avatarPath, avatar);

        // observe percentage changes
        //  this.uploadPercent = task.percentageChanges();
        // get notified when the download URL is available
        task.snapshotChanges().pipe(
            finalize(async () => {
                this.downloadURL = await fileRef.getDownloadURL().toPromise();
                this.store.dispatch(changeAvatar({avatarUrl: avatar.name}));
            })
            )
            .subscribe();

        return task.percentageChanges();
    }
}

