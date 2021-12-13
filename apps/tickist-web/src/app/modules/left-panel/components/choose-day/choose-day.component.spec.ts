import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { ChooseDayComponent } from "./choose-day.component";
import { TickistMaterialModule } from "../../../../material.module";
import { MockConfigurationService } from "../../../../testing/mocks/configurationService";
import { ReactiveFormsModule } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { StoreModule } from "@ngrx/store";

describe("ChooseDayComponent", () => {
    let component: ChooseDayComponent;
    let fixture: ComponentFixture<ChooseDayComponent>;

    beforeEach(async(() => {
        const configurationService = new MockConfigurationService();
        TestBed.configureTestingModule({
            imports: [
                TickistMaterialModule,
                ReactiveFormsModule,
                NoopAnimationsModule,
                StoreModule.forRoot({}),
            ],
            declarations: [ChooseDayComponent],
            providers: [configurationService.getProviders()],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChooseDayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
