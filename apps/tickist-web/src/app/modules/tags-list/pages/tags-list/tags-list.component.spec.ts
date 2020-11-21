import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TagsListComponent} from './tags-list.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MockUserService} from '../../../../testing/mocks/userService';
import {MockProjectService} from '../../../../testing/mocks/project-service';
import {MockTasksFiltersService} from '../../../../testing/mocks/tasks-filters-service';
import {MockConfigurationService} from '../../../../testing/mocks/configurationService';
import {TickistMaterialModule} from '../../../../material.module';
import {MockTaskService} from '../../../../testing/mocks/task-service';
import {MockTagsFiltersService} from '../../../../testing/mocks/tags-filters-service';
import {MockTagService} from '../../../../testing/mocks/tag-service';
import {StoreModule} from '@ngrx/store';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {environment} from '@env/environment.dev';


let comp: TagsListComponent;
let fixture: ComponentFixture<TagsListComponent>;


describe('Component: Tags list component', () => {
    beforeEach(async(() => {
        const projectService = new MockProjectService();
        const tagService = new MockTagService();
        const userService = new MockUserService();
        const tasksService = new MockTaskService();
        const tagsFiltersService = new MockTagsFiltersService();
        const tasksFiltersService = new MockTasksFiltersService();
        const configurationService = new MockConfigurationService();

        TestBed.configureTestingModule({
            imports: [
                TickistMaterialModule,
                ReactiveFormsModule,
                FormsModule,
                StoreModule.forRoot({}),
                AngularFireModule.initializeApp(environment.firebase),
                AngularFireAuthModule, AngularFirestoreModule],
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
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(TagsListComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
