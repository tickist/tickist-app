import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {UserAvatarComponent} from './user-avatar.component';
import {TickistMaterialModule} from '../app.module';
import {AvatarSize} from '../pipes/avatarSize';
import {SimplyUser} from '../models/user/simply-user';

describe('UserAvatarComponent', () => {
    let component: UserAvatarComponent;
    let fixture: ComponentFixture<UserAvatarComponent>;
    
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            declarations: [UserAvatarComponent, AvatarSize]
        }).compileComponents();
    }));
    
    beforeEach(() => {
        fixture = TestBed.createComponent(UserAvatarComponent);
        component = fixture.componentInstance;
        component.user =  new SimplyUser({id: '1', 'username': 'test'});
        fixture.detectChanges();
    });
    
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
