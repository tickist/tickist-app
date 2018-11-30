import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {TagComponent} from './tag.component';
import {ReactiveFormsModule} from '@angular/forms';
import {MockTaskService} from '../../testing/mocks/task-service';
import {MockTagService} from '../../testing/mocks/tag-service';
import {TickistMaterialModule} from '../../material.module';
import {MockTasksFiltersService} from '../../testing/mocks/tasks-filters-service';

let comp: TagComponent;
let fixture: ComponentFixture<TagComponent>;


describe('TagComponent', () => {

    beforeEach(async(() => {
        const taskService = new MockTaskService();
        const tagService = new MockTagService();
        const tasksFiltersService = new MockTasksFiltersService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, ReactiveFormsModule],
            declarations: [TagComponent],
            providers: [
                taskService.getProviders(),
                tagService.getProviders(),
                tasksFiltersService.getProviders(),
            ]
        })
            .compileComponents().then(() => {
            fixture = TestBed.createComponent(TagComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create', () => {
        expect(comp).toBeTruthy();
    });
});
