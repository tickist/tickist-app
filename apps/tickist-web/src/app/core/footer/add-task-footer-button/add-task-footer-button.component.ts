import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { editTaskRoutesName } from "../../../modules/edit-task/routes-names";
import { Router, RouterLink } from "@angular/router";
import { Store } from "@ngrx/store";
import { selectAddTaskButtonVisibility } from "../../../reducers/core.selectors";
import { Observable } from "rxjs";
import { homeRoutesName } from "../../../routing.module.name";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { NgIf, AsyncPipe } from "@angular/common";

@Component({
    selector: "tickist-add-task-footer-button",
    templateUrl: "./add-task-footer-button.component.html",
    styleUrls: ["./add-task-footer-button.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgIf,
        MatButtonModule,
        RouterLink,
        FaIconComponent,
        AsyncPipe,
    ],
})
export class AddTaskFooterButtonComponent implements OnInit {
    addTaskButtonVisibility$: Observable<boolean>;

    constructor(
        private store: Store,
        private router: Router,
    ) {}

    ngOnInit() {
        this.addTaskButtonVisibility$ = this.store.select(selectAddTaskButtonVisibility);
    }

    navigateToCreateNewTask() {
        this.router.navigate([homeRoutesName.home, editTaskRoutesName.editTask]);
    }
}
