import { Component, OnDestroy, OnInit } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { Store } from "@ngrx/store";
import { selectApiErrorBarIsVisible } from "../../../reducers/core.selectors";
import { NgIf, AsyncPipe } from "@angular/common";

@Component({
    selector: "tickist-show-api-error",
    templateUrl: "./show-api-error.component.html",
    styleUrls: ["./show-api-error.component.scss"],
    standalone: true,
    imports: [NgIf, AsyncPipe],
})
export class ShowApiErrorComponent implements OnInit, OnDestroy {
    isVisible$: Observable<boolean>;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private store: Store) {}

    ngOnInit() {
        this.isVisible$ = this.store.select(selectApiErrorBarIsVisible);
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}
