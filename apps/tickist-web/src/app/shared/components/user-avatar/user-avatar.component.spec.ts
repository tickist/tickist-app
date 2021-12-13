import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { UserAvatarComponent } from "./user-avatar.component";
import { TickistMaterialModule } from "../../../material.module";
import { Storage } from "@angular/fire/storage";
import { FireStorageStub } from "../../../testing/stubs/angular-fire-storage.stub";

describe("UserAvatarComponent", () => {
    let component: UserAvatarComponent;
    let fixture: ComponentFixture<UserAvatarComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [TickistMaterialModule],
            providers: [{ provide: Storage, useValue: FireStorageStub }],
            declarations: [UserAvatarComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UserAvatarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
