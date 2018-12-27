import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TagsComponent} from './tags.component';
import {MockProjectService} from '../../testing/mocks/project-service';
import {MockConfigurationService} from '../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../material.module';
import {MockTagService} from '../../testing/mocks/tag-service';
import {MockTaskService} from '../../testing/mocks/task-service';
import {MockTasksFiltersService} from '../../testing/mocks/tasks-filters-service';
import {MockUserService} from '../../testing/mocks/userService';

let comp: TagsComponent;
let fixture: ComponentFixture<TagsComponent>;


describe('Component: Tags', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const tagService = new MockTagService();
        const userService = new MockUserService();
        const taskService = new MockTaskService();
        const tasksFiltersService = new MockTasksFiltersService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [TagsComponent],
            providers: [
                projectService.getProviders(),
                tagService.getProviders(),
                userService.getProviders(),
                tasksFiltersService.getProviders(),
                taskService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(TagsComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
