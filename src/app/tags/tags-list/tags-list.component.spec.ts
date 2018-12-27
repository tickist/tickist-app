import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TagsListComponent} from './tags-list.component';
import {MockConfigurationService} from '../../testing/mocks/configurationService';
import {MockProjectService} from '../../testing/mocks/project-service';
import {TickistMaterialModule} from '../../material.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MockTagService} from '../../testing/mocks/tag-service';
import {MockTaskService} from '../../testing/mocks/task-service';
import {MockUserService} from '../../testing/mocks/userService';
import {MockTagsFiltersService} from '../../testing/mocks/tags-filters-service';
import {MockTasksFiltersService} from '../../testing/mocks/tasks-filters-service';

let comp: TagsListComponent;
let fixture: ComponentFixture<TagsListComponent>;


describe('Component: ForgotPassword', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const tagService = new MockTagService();
        const userService = new MockUserService();
        const tasksService = new MockTaskService();
        const tagsFiltersService = new MockTagsFiltersService();
        const tasksFiltersService = new MockTasksFiltersService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, ReactiveFormsModule, FormsModule],
            declarations: [TagsListComponent],
            providers: [
                projectService.getProviders(),
                tasksService.getProviders(),
                tasksFiltersService.getProviders(),
                tagsFiltersService.getProviders(),
                userService.getProviders(),
                tagService.getProviders(),
                configurationService.getProviders()
            ],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(TagsListComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
