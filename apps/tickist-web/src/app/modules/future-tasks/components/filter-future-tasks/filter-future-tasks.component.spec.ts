import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FilterFutureTasksComponent } from "./filter-future-tasks.component";
import { FlexLayoutModule } from "@ngbracket/ngx-layout";
import { TickistMaterialModule } from "../../../../material.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { StoreModule } from "@ngrx/store";
import { FormsModule } from "@angular/forms";
import { MockFutureTasksFiltersService } from "../../../../testing/mocks/future-tasks-fiters-service";
import { IconsModule } from "../../../../icons.module";

describe("FilterFutureTasksComponent", () => {
    let component: FilterFutureTasksComponent;
    let fixture: ComponentFixture<FilterFutureTasksComponent>;
    const futureTaskFiltersService = new MockFutureTasksFiltersService();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, FlexLayoutModule, TickistMaterialModule, NoopAnimationsModule, StoreModule.forRoot({}), IconsModule],
            declarations: [FilterFutureTasksComponent],
            providers: [futureTaskFiltersService.getProviders()],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FilterFutureTasksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
