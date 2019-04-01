import {Meta} from '@angular/platform-browser';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    constructor(private meta: Meta) {
        meta.addTags([
            {name: 'description', content: 'To-do-list application inspired by GTD methodology and life experience. ' +
                    'Join us and create tasks, projects, tags. We are open source.'},
            {name: 'viewport', content: 'width=device-width, initial-scale=1'},
            {name: 'robots', content: 'INDEX, FOLLOW'},
            {name: 'author', content: 'Tickist'},
            {name: 'keywords', content: 'Todo list, Todolist, GTD, tickist, task, project'},
            {name: 'date', content: '2018-06-02', scheme: 'YYYY-MM-DD'},
            {httpEquiv: 'Content-Type', content: 'text/html'},
            {property: 'og:title', content: 'Tickist - Enjoy the Ticking'},
            {property: 'og:type', content: 'website'},
            {charset: 'UTF-8'}
        ]);
    }
}
