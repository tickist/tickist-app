import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ShowOfflineModeComponent } from "./show-offline-mode.component";
import { MockConfigurationService } from "../../../testing/mocks/configurationService";
import { StoreModule } from "@ngrx/store";

describe("ShowOfflineModeComponent", () => {
    let component: ShowOfflineModeComponent;
    let fixture: ComponentFixture<ShowOfflineModeComponent>;

    beforeEach(async(() => {
        const configurationService = new MockConfigurationService();
        TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            declarations: [ShowOfflineModeComponent],
            providers: [configurationService.getProviders()],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(ShowOfflineModeComponent);
                component = fixture.componentInstance;
            });
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
