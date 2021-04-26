import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from "@ngrx/store";
import {clearArchive, getArchivedTasks} from "../../actions/archive.actions";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable, Subject} from "rxjs";
import {getTasksFromArchiveWithFilters, isFetchingArchive} from "../../selectors/archive.selectors";
import {selectLoggedInUser} from "../../../../core/selectors/user.selectors";
import {filter, takeUntil} from "rxjs/operators";
import {Project, Task, TASK_EXTENDED_VIEW} from '@data';
import {selectProjectById} from "../../../../core/selectors/projects.selectors";
import {editProjectSettingsRoutesName} from "../../../edit-project/routes-names";
import {homeRoutesName} from '../../../../routing.module.name';

@Component({
    selector: 'tickist-archive',
    templateUrl: './archive.component.html',
    styleUrls: ['./archive.component.scss']
})
export class ArchiveComponent implements OnInit, OnDestroy {
    projectId: string;
    isLoading = true;
    tasks$: Observable<Task[]>
    project$: Observable<Project>
    taskView = TASK_EXTENDED_VIEW.value;

    private ngUnsubscribe: Subject < void > = new Subject<void>();
    constructor(private store: Store, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.projectId = this.route.snapshot.paramMap.get('projectId');
        this.project$ = this.store.select(selectProjectById(this.projectId))
        this.store.select(isFetchingArchive).pipe(
            takeUntil(this.ngUnsubscribe)
        ).subscribe(isLoading => {
            this.isLoading = isLoading;
            this.cd.detectChanges();
        })
        this.tasks$ = this.store.select(getTasksFromArchiveWithFilters)
        this.store.pipe(
            select(selectLoggedInUser),
            filter(loggedInUser => !!loggedInUser),
            takeUntil(this.ngUnsubscribe)
        ).subscribe(loggedInUser => {
            this.store.dispatch(getArchivedTasks({projectId: this.projectId, userId: loggedInUser.id}))
        })
    }

    ngOnDestroy(): void {
        this.store.dispatch(clearArchive())
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    trackByFn(index, item): number {
        return item.id;
    }

}
