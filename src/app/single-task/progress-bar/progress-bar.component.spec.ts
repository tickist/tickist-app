import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import {ProgressBarComponent} from './progress-bar.component';
import {TickistMaterialModule} from '../../material.module';
import {MenuButtonComponent} from '../../shared/menu-button/menu-button.component';
import {MockObservableMedia} from '../../testing/mocks/observableMedia';


describe('ProgressBarComponent', () => {
    let component: ProgressBarComponent;
    let fixture: ComponentFixture<ProgressBarComponent>;
    const observableMedia = new MockObservableMedia();
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [ProgressBarComponent, MockComponent(MenuButtonComponent)],
            providers: [
                observableMedia.getProviders()
            ]
        }).compileComponents();
    }));
    
    beforeEach(() => {
        fixture = TestBed.createComponent(ProgressBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
