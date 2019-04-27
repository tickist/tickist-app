import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {AddTaskTreeViewComponent} from './add-task-tree-view.component';
import {TickistMaterialModule} from '../../../../material.module';
import {ReactiveFormsModule} from '@angular/forms';
import {StoreModule} from '@ngrx/store';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('AddTaskTreeViewComponent', () => {
    let component: AddTaskTreeViewComponent;
    let fixture: ComponentFixture<AddTaskTreeViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                TickistMaterialModule,
                ReactiveFormsModule,
                StoreModule.forRoot({}),
                NoopAnimationsModule
            ],
            declarations: [AddTaskTreeViewComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddTaskTreeViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
