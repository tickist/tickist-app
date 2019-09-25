import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {UserAvatarComponent} from './user-avatar.component';
import {TickistMaterialModule} from '../../material.module';
import {AvatarSize} from '../../shared/pipes/avatarSize';
import {SimpleUser} from '@data/users/models';

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
        component.user =  new SimpleUser({
            id: 1,
            username: 'test',
            email: 'test@tickist-web.com',
            avatar: 'avatar',
            avatar_url: '',
            share_with: []
        });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
