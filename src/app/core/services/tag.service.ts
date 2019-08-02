import {Injectable} from '@angular/core';
import {Tag} from '../../models/tags';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {ITagApi} from '../../models/tag-api.interface';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {environment} from '../../../environments/environment';

const tagsCollectionName = 'tags';


@Injectable()
export class TagService {
    tagsCollection$: AngularFirestoreCollection<Tag>;

    constructor(private db: AngularFirestore, private http: HttpClient, private authFire: AngularFireAuth) {
        // this.tagsCollection$ = this.db.collection('tags');
    }

    loadTags() {
        return this.db.collection(tagsCollectionName).get();
        // return this.http.get<ITagApi[]>(`${environment['apiUrl']}/tag/`)
        //     .pipe(
        //         map(payload => payload.map(tag => new Tag(tag))),
        //     );
    }

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
        // @Todo do something with that

        return this.http.post<ITagApi>(`${environment['apiUrl']}/tag/`, tag)
            .pipe(
                map(payload => new Tag(<any> payload)),
                map(payload => {
                // this.store.dispatch(new tagsAction.CreateTag(payload));
                return payload;
            }));
    }

    updateTag(tag: Tag) {
        return this.db.collection(tagsCollectionName).doc(tag.id).update({...tag});
    }

    deleteTag(tagId: number) {
        return this.http.delete(`${environment['apiUrl']}/tag/${tagId}/`);
    }

}
