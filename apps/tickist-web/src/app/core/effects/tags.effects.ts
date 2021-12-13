import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { concatMap, mergeMap, switchMap, withLatestFrom } from "rxjs/operators";
import { Store } from "@ngrx/store";
import { addTags, deleteTag, queryTags, requestCreateTag, requestDeleteTag, requestUpdateTag, updateTag } from "../actions/tags.actions";
import { Tag } from "@data/tags/models/tags";
import { Update } from "@ngrx/entity";
import { TagService } from "../services/tag.service";
import { selectLoggedInUser } from "../selectors/user.selectors";
import { collection, collectionChanges, Firestore, query, where } from "@angular/fire/firestore";

@Injectable()
export class TagsEffects {
    query$ = createEffect(() =>
        this.actions$.pipe(
            ofType(queryTags),
            withLatestFrom(this.store.select(selectLoggedInUser)),
            switchMap(([, user]) => {
                const firebaseCollection = collection(this.firestore, "tags");
                const firebaseQuery = query(firebaseCollection, where("author", "==", user.id));
                return collectionChanges(firebaseQuery);
            }),
            concatMap((actions) => {
                const addedTags: Tag[] = [];
                let deletedTagId: string;
                let updatedTag: Update<Tag>;
                actions.forEach((action) => {
                    console.log(action.doc.id);
                    console.log(action.type);
                    if (action.type === "added") {
                        const data: any = action.doc.data();
                        addedTags.push(
                            new Tag({
                                id: action.doc.id,
                                ...data,
                            })
                        );
                    }
                    if (action.type === "modified") {
                        const data: any = action.doc.data();
                        updatedTag = {
                            id: action.doc.id,
                            changes: new Tag({ ...data }),
                        };
                    }
                    if (action.type === "removed") {
                        deletedTagId = action.doc.id;
                    }
                });
                const returnsActions = [];
                if (addedTags.length > 0) {
                    returnsActions.push(addTags({ tags: addedTags }));
                }
                if (updatedTag) {
                    returnsActions.push(updateTag({ tag: updatedTag }));
                }
                if (deletedTagId) {
                    returnsActions.push(deleteTag({ tagId: deletedTagId }));
                }
                console.log({ returnsActions });
                return returnsActions;
            })
        )
    );

    createTag$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(requestCreateTag),
                mergeMap((action) => this.tagsService.createTag(action.tag))
            ),
        { dispatch: false }
    );

    updateTag$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(requestUpdateTag),
                mergeMap((action) => this.tagsService.updateTag(<Tag>action.tag.changes))
            ),
        { dispatch: false }
    );

    deleteTag$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(requestDeleteTag),
                mergeMap((action) => this.tagsService.deleteTag(action.tagId))
            ),
        { dispatch: false }
    );

    constructor(private actions$: Actions, private tagsService: TagService, private firestore: Firestore, private store: Store) {}
}
