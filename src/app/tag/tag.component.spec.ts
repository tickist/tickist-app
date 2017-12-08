/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TagComponent } from './tag.component';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {MockTaskService} from '../testing/mocks/taskService';
import {MockTagService} from '../testing/mocks/tagService';
import {TickistMaterialModule} from "../app.module";

let comp: TagComponent;
let fixture: ComponentFixture<TagComponent>;


describe('TagComponent', () => {

  beforeEach(async(() => {
    const taskService = new MockTaskService();
    const tagService = new MockTagService();

    TestBed.configureTestingModule({
      imports: [TickistMaterialModule, ReactiveFormsModule],
      declarations: [ TagComponent ],
      providers: [
        taskService.getProviders(),
        tagService.getProviders()
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
