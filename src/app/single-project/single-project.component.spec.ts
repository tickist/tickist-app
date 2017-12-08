/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import { SingleProjectComponent } from './single-project.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule, Routes} from '@angular/router';
import {MockProjectService} from '../testing/mocks/projectService';
import {MockConfigurationService} from '../testing/mocks/configurationService';
import {BlankComponent, RootComponent} from '../testing/test.modules';
import {TickistMaterialModule} from '../app.module';

let comp: SingleProjectComponent;
let fixture: ComponentFixture<SingleProjectComponent>;


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: RootComponent
  },
  {
    path: 'login',
    component: BlankComponent
  }
];

describe('SingleProjectComponent', () => {

  beforeEach(async(() => {
    const projectService = new MockProjectService();
    const configurationService = new MockConfigurationService();

    TestBed.configureTestingModule({
      imports: [TickistMaterialModule, ReactiveFormsModule, FormsModule, RouterModule.forRoot(routes), NoopAnimationsModule],
      declarations: [SingleProjectComponent, RootComponent, BlankComponent],
      providers: [
        projectService.getProviders(),
        configurationService.getProviders(),
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    })
    .compileComponents().then(() => {
      fixture = TestBed.createComponent(SingleProjectComponent);
      comp = fixture.componentInstance;
    });
  }));


  it('should be created', () => {
    expect(comp).toBeTruthy();
  });
});
