import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {Headers} from '@angular/http';
import {select, Store} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {AppStore} from '../store';
import {Tag} from '../models/tags';
import * as tagsAction from '../reducers/actions/tags';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {ITagApi} from '../models/tag-api.interface';

@Injectable()
export class TagService {
    tags$: Observable<Tag[]>;

    constructor(public http: HttpClient, private store: Store<AppStore>) {
        this.tags$ = this.store.pipe(
            select(s => s.tags)
        );
    }

    loadTags() {
        return this.http.get<ITagApi[]>(`${environment['apiUrl']}/tag/`)
            .pipe(
                map(payload => payload.map(tag => new Tag(tag))),
                map(payload => this.store.dispatch(new tagsAction.AddTags(payload)))
            );
    }

    saveTag(tag: Tag) {
        (tag.id) ? this.updateTag(tag) : this.createTag(tag);
    }

    createTag(tag: Tag) {
        this.http.post<ITagApi>(`${environment['apiUrl']}/tag/`, tag)
            .pipe(map(payload => new Tag(payload)))
            .subscribe(payload => this.store.dispatch(new tagsAction.CreateTag(payload)));
    }

    createTagDuringEditingTask(tag: Tag) {
        return this.http.post<ITagApi>(`${environment['apiUrl']}/tag/`, tag)
            .pipe(
                map(payload => new Tag(payload)),
                map(payload => {
                this.store.dispatch(new tagsAction.CreateTag(payload));
                return payload;
            }));
    }

    updateTag(tag: Tag): void {
        this.http.put<ITagApi>(`${environment['apiUrl']}/tag/${tag.id}/`, tag)
            .subscribe(payload => this.store.dispatch(new tagsAction.UpdateTag(new Tag(payload))));
    }

    deleteTag(tag: Tag): void {
        this.http.delete(`${environment['apiUrl']}/tag/${tag.id}/`)
            .subscribe(() => this.store.dispatch(new tagsAction.DeleteTag(tag)));
    }

}
