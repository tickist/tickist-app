import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {PinButtonComponent} from './pin-button.component';
import {TickistMaterialModule} from '../../app.module';

describe('PinButtonComponent', () => {
    let component: PinButtonComponent;
    let fixture: ComponentFixture<PinButtonComponent>;
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [PinButtonComponent]
        })
            .compileComponents();
    }));
    
    beforeEach(() => {
        fixture = TestBed.createComponent(PinButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
