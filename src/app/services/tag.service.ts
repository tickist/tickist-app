import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {Tag} from '../models/tags';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {ITagApi} from '../models/tag-api.interface';


@Injectable()
export class TagService {

    constructor(public http: HttpClient) {}

    loadTags() {
        return this.http.get<ITagApi[]>(`${environment['apiUrl']}/tag/`)
            .pipe(
                map(payload => payload.map(tag => new Tag(tag))),
            );
    }

    saveTag(tag: Tag) {
        (tag.id) ? this.updateTag(tag) : this.createTag(tag);
    }

    createTag(tag: Tag) {
        return this.http.post<ITagApi>(`${environment['apiUrl']}/tag/`, tag)
            .pipe(map(payload => new Tag(payload)));
    }

    createTagDuringEditingTask(tag: Tag) {
        // @Todo do something with that

        return this.http.post<ITagApi>(`${environment['apiUrl']}/tag/`, tag)
            .pipe(
                map(payload => new Tag(payload)),
                map(payload => {
                // this.store.dispatch(new tagsAction.CreateTag(payload));
                return payload;
            }));
    }

    updateTag(tag: Tag) {
        return this.http.put<ITagApi>(`${environment['apiUrl']}/tag/${tag.id}/`, tag);
    }

    deleteTag(tagId: number) {
        return this.http.delete(`${environment['apiUrl']}/tag/${tagId}/`);
    }

}
