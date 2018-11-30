import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {Headers} from '@angular/http';
import {Store} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {AppStore} from '../store';
import {Tag} from '../models/tags';
import * as tagsAction from '../reducers/actions/tags';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';

@Injectable()
export class TagService {
    tags$: Observable<Tag[]>;
    headers: Headers;

    constructor(public http: HttpClient, private store: Store<AppStore>) {
        this.tags$ = this.store.select(s => s.tags);

    }

    loadTags() {
        return this.http.get<Tag[]>(`${environment['apiUrl']}/tag/`)
            .pipe(
                map(payload => payload.map(tag => new Tag(tag))),
                map(payload => this.store.dispatch(new tagsAction.AddTags(payload)))
            );
    }

    saveTag(tag: Tag) {
        (tag.id) ? this.updateTag(tag) : this.createTag(tag);
    }

    createTag(tag: Tag) {
        this.http.post(`${environment['apiUrl']}/tag/`, tag)
            .pipe(map(payload => new Tag(payload)))
            .subscribe(payload => this.store.dispatch(new tagsAction.CreateTag(payload)));
    }

    createTagDuringEditingTask(tag: Tag) {
        return this.http.post(`${environment['apiUrl']}/tag/`, tag)
            .pipe(
                map(payload => new Tag(payload)),
                map(payload => {
                this.store.dispatch(new tagsAction.CreateTag(payload));
                return payload;
            }));
    }

    updateTag(tag: Tag) {
        this.http.put(`${environment['apiUrl']}/tag/${tag.id}/`, tag)
            .subscribe(payload => this.store.dispatch(new tagsAction.UpdateTag(new Tag(payload))));
    }

    deleteTag(tag: Tag) {
        this.http.delete(`${environment['apiUrl']}/tag/${tag.id}/`)
            .subscribe(payload => this.store.dispatch(new tagsAction.DeleteTag(tag)));
    }

}
