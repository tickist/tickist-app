import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ProjectsListComponent} from './projects-list.component';
import {MenuButtonComponent} from '../../../../../../shared/components/menu-button/menu-button.component';
import {TickistMaterialModule} from '../../../../../../material.module';
import {BlankComponent, RootComponent} from '../../../../../../testing/test.modules';
import {RouterModule, Routes} from '@angular/router';
import {SingleProjectComponent} from '../../components/single-project/single-project.component';
import { MockComponent } from 'ng-mocks';
import {FormsModule} from '@angular/forms';
import {APP_BASE_HREF} from '@angular/common';
import {MockTaskService} from '../../../../../../testing/mocks/task-service';
import {MockProjectService} from '../../../../../../testing/mocks/project-service';
import {MockUserService} from '../../../../../../testing/mocks/userService';
import {MockConfigurationService} from '../../../../../../testing/mocks/configurationService';
import {MockObservableMedia} from '../../../../../../testing/mocks/mediaObserver';
import {MockProjectsFiltersService} from '../../../../../../testing/mocks/projects-filters-service';
import {StoreModule} from '@ngrx/store';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: RootComponent,
        children: [
            {path: 'projects/:projectId', component: BlankComponent},
            {path: 'projects', component: BlankComponent}
        ]
    }
];


describe('ProjectsListComponent', () => {
    let component: ProjectsListComponent;
    let fixture: ComponentFixture<ProjectsListComponent>;
    const taskService = new MockTaskService();
    const projectService = new MockProjectService();
    const userService = new MockUserService();
    const configurationService = new MockConfigurationService();
    const observableMedia = new MockObservableMedia();
    const projectsFiltersService = new MockProjectsFiltersService();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule, RouterModule.forRoot(routes), FormsModule, StoreModule.forRoot({})],
            declarations: [ProjectsListComponent,
                MockComponent(MenuButtonComponent),
                RootComponent,
                BlankComponent,
                MockComponent(SingleProjectComponent)],
            providers: [
                {provide: APP_BASE_HREF, useValue: '/'},
                taskService.getProviders(),
                projectService.getProviders(),
                observableMedia.getProviders(),
                configurationService.getProviders(),
                userService.getProviders(),
                projectsFiltersService.getProviders()
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(ProjectsListComponent);
            component = fixture.componentInstance;
        });
    }));

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
