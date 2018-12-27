import {TestBed, ComponentFixture, async} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ColorPickerComponent} from './color-picker.component';

let comp: ColorPickerComponent;
let fixture: ComponentFixture<ColorPickerComponent>;


describe('Component: ForgotPassword', () => {
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [ColorPickerComponent],
            schemas: [ NO_ERRORS_SCHEMA ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(ColorPickerComponent);
            comp = fixture.componentInstance;

        });
    }));
    it('should create an instance', () => {
        expect(comp).toBeTruthy();
    });
});
