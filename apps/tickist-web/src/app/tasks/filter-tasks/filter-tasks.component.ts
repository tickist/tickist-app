import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { TasksFiltersService } from "../../core/services/tasks-filters.service";
import { TagsFilterDialogComponent } from "../tags-filter-dialog/tags-filter-dialog.component";
import { EstimateTimeDialogComponent } from "../estimate-time-dialog/estimate-time-dialog.component";
import { TasksFilterDialogComponent } from "../tasks-filter-dialog/tasks-filter-dialog.component";
import { AssignedToDialogComponent } from "../assigned-to-dialog/assigned-to.dialog.component";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import {
    selectCurrentAssignedToFilter,
    selectCurrentEstimateTimeFilter,
    selectCurrentMainFilter,
    selectCurrentTagsFilter,
} from "../../core/selectors/filters-tasks.selectors";
import { Store } from "@ngrx/store";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Filter } from "@data/filter";
import { NgIf, AsyncPipe } from "@angular/common";
import { MatMenuModule } from "@angular/material/menu";
import { MenuButtonComponent } from "../../shared/components/menu-button/menu-button.component";

@Component({
    selector: "tickist-filter-tasks",
    templateUrl: "./filter-tasks.component.html",
    styleUrls: ["./filter-tasks.component.scss"],
    standalone: true,
    imports: [
        MenuButtonComponent,
        MatMenuModule,
        NgIf,
        AsyncPipe,
    ],
})
export class FilterTasksComponent implements OnInit, OnDestroy {
    @Input() showTags: boolean;
    @Input() isAssignedToVisible? = false;
    currentMainFilter$: Observable<Filter>;
    currentAssignedToFilter$: Observable<Filter>;
    currentTagsFilter$: Observable<Filter>;
    currentEstimateTimeFilter$: Observable<{
        currentFilterLt: Filter;
        currentFilterGt: Filter;
    }>;
    tagsFilter: Filter;
    tagsFilterValue: any = {};
    matDialogConfig: MatDialogConfig;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(public dialog: MatDialog, private tasksFiltersService: TasksFiltersService, private store: Store) {
        this.matDialogConfig = { width: "300px" };
    }

    openTasksFilterDialog() {
        this.dialog.open(TasksFilterDialogComponent, this.matDialogConfig);
    }

    openAssignedToDialog() {
        this.dialog.open(AssignedToDialogComponent, this.matDialogConfig);
    }

    openTagsFilterDialog() {
        this.dialog.open(TagsFilterDialogComponent, this.matDialogConfig);
    }

    openEstimateTimeDialog() {
        this.dialog.open(EstimateTimeDialogComponent, this.matDialogConfig);
    }

    ngOnInit() {
        this.currentMainFilter$ = this.store.select(selectCurrentMainFilter);
        this.currentAssignedToFilter$ = this.store.select(selectCurrentAssignedToFilter);
        this.currentEstimateTimeFilter$ = this.store.select(selectCurrentEstimateTimeFilter);
        this.currentTagsFilter$ = this.store.select(selectCurrentTagsFilter);
        this.currentTagsFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((tagsFilter) => {
            this.tagsFilter = tagsFilter;
        });
    }

    tagsValue() {
        if (this.tagsFilter) {
            if (this.tagsFilter.value instanceof Array && this.tagsFilter.value?.length === 1) {
                return `${this.tagsFilter.name} selected`;
            } else if (this.tagsFilter.value instanceof Array && this.tagsFilter.value?.length) {
                return `${this.tagsFilter.value.length} selected`;
            } else {
                return this.tagsFilter.name;
            }
        } else {
            return "";
        }
    }
    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
