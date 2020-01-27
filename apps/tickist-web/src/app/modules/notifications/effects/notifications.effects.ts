import {Injectable} from '@angular/core';
import {Actions, createEffect, Effect, ofType} from '@ngrx/effects';
import {AddTags, DeleteTag, QueryTags, TagActionTypes, UpdateTag} from '../../../core/actions/tags.actions';
import {concatMap, switchMap} from 'rxjs/operators';
import {Tag} from '@data/tags';
import {Update} from '@ngrx/entity';
import {addNotifications, queryNotifications, updateNotification} from '../actions/notifications.actions';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {Notification} from '@data/notifications';


@Injectable()
export class NotificationsEffects {

    query$ = createEffect(() =>
        this.actions$
            .pipe(
                ofType<QueryTags>(queryNotifications),
                switchMap(() => {
                    return this.db.collection(
                        'notifications',
                        ref => ref.where('recipient', '==', this.authFire.auth.currentUser.uid).limit(30))
                        .stateChanges();
                }),
                concatMap(actions => {
                    const addedNotifications: Notification[] = [];
                    let deletedTagId: string;
                    let updatedNotification: Update<Notification>;
                    console.log(actions);
                    actions.forEach((action => {
                        if (action.type === 'added') {
                            const data: any = action.payload.doc.data();
                            addedNotifications.push(new Notification({
                                id: action.payload.doc.id,
                                ...data
                            }));
                        }
                        if (action.type === 'modified') {
                            const data: any = action.payload.doc.data();
                            updatedNotification = {
                                id: action.payload.doc.id,
                                changes: new Notification({...data})
                            };
                        }
                        if (action.type === 'removed') {
                            deletedTagId = action.payload.doc.id;
                        }
                    }));
                    const returnsActions = [];
                    if (addedNotifications.length > 0) {
                        returnsActions.push(addNotifications({notifications: addedNotifications}));
                    }
                    if (updatedNotification) {
                        returnsActions.push(updateNotification({notification: updatedNotification}));
                    }

                    return returnsActions;
                })
            ));

    constructor(private actions$: Actions, private db: AngularFirestore, private authFire: AngularFireAuth) {
    }

}
