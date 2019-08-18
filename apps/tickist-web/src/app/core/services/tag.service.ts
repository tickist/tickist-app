import {Injectable} from '@angular/core';
import {Tag} from '../../models/tags/tags';
import {HttpClient} from '@angular/common/http';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {environment} from '../../../environments/environment';

const tagsCollectionName = 'tags';


@Injectable()
export class TagService {

    constructor(private db: AngularFirestore, private http: HttpClient, private authFire: AngularFireAuth) {
        // this.tagsCollection$ = this.db.collection('tags');
    }

    // loadTags() {
    //     return this.db.collection(tagsCollectionName).get();
    //     // return this.http.get<ITagApi[]>(`${environment['apiUrl']}/tag/`)
    //     //     .pipe(
    //     //         map(payload => payload.map(tag => new Tag(tag))),
    //     //     );
    // }

    saveTag(tag: Tag) {
        (tag.id) ? this.updateTag(tag) : this.createTag(tag);
    }

    createTag(tag: Tag) {
        // const uid = this.authFire.auth.currentUser.uid;
        // tag.author = uid;
        const newTagRef = this.db.collection(tagsCollectionName).ref.doc();
        return newTagRef.set({...tag, id: newTagRef.id});
        // return this.http.post<ITagApi>(`${environment['apiUrl']}/tag/`, tag)
        //     .pipe(map(payload => new Tag(payload)));
    }

    createTagDuringEditingTask(tag: Tag) {
        const newTagRef = this.db.collection(tagsCollectionName).ref.doc();
        return this.createTag(tag).then(() => {
            return newTagRef.id;
        });

        // @Todo do something with that
//         this.db.firestore.runTransaction(transaction =>
// // This code may get re-run multiple times if there are conflicts.
//
//
//             transaction.get(sfDocRef)
//                 .then(sfDoc => {
//                     const newPopulation = sfDoc.data().population + 1;
//                     transaction.update(sfDocRef, { population: sfDoc.data().population + 1 });
//                 })).then(() => console.log("Transaction successfully committed!"))
//             .catch(error => console.log("Transaction failed: ", error));
        // return this.http.post<ITagApi>(`${environment['apiUrl']}/tag/`, tag)
        //     .pipe(
        //         map(payload => new Tag(<any> payload)),
        //         map(payload => {
        //         // this.store.dispatch(new tagsAction.CreateTag(payload));
        //         return payload;
        //     }));
    }

    updateTag(tag: Tag) {
        return this.db.collection(tagsCollectionName).doc(tag.id).update({...tag});
    }

    deleteTag(tagId: string) {
        return this.http.delete(`${environment['apiUrl']}/tag/${tagId}/`);
    }

}
