import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { Tag } from "@data/tags/models/tags";
import { TasksFiltersService } from "../../../../core/services/tasks-filters.service";
import { requestDeleteTag, requestUpdateTag } from "../../../../core/actions/tags.actions";
import { Store } from "@ngrx/store";
import { selectCurrentTagsFilter } from "../../../../core/selectors/filters-tasks.selectors";
import { Filter } from "@data/filter";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { setCurrentTagsFilters } from "../../../../core/actions/tasks/tags-filters-tasks.actions";

@Component({
    selector: "tickist-tag",
    templateUrl: "./tag.component.html",
    styleUrls: ["./tag.component.scss"],
})
export class TagComponent implements OnInit, OnDestroy {
    @Input() label: string;
    @Input() id: string;
    @Input() tasksCounter: number;
    @Input() tag?: Tag;
    tagsIds: string | Set<string>;
    isActive: boolean;
    isChecked: boolean;
    editTagForm: UntypedFormGroup;
    editMode = false;
    isCheckboxModeEnabled = false;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    constructor(private fb: UntypedFormBuilder, private tasksFiltersService: TasksFiltersService, private store: Store) {
        this.isActive = false;
    }

    ngOnInit() {
        this.store
            .select(selectCurrentTagsFilter)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((filter) => {
                if (!filter) return;
                if (filter.value instanceof Array) {
                    this.tagsIds = new Set(filter.value);
                } else {
                    this.tagsIds = filter.value;
                }
                this.isActive = (this.tagsIds instanceof Set && this.tagsIds.has(this.id)) || this.tagsIds === this.id;
                this.isChecked = (this.tagsIds instanceof Set && this.tagsIds.has(this.id)) || this.tagsIds === this.id;
                this.isCheckboxModeEnabled = this.isId(this.id) && this.tagsIds instanceof Set && this.tagsIds.size > 0;
            });
        this.editTagForm = new UntypedFormGroup({
            name: new UntypedFormControl(this.label, Validators.required),
        });
    }

    editTag(values) {
        const tag = JSON.parse(JSON.stringify(this.tag));
        tag.name = values["name"];
        this.store.dispatch(requestUpdateTag({ tag: { id: tag.id, changes: tag } }));
        this.editMode = !this.editMode;
    }

    deleteTag() {
        this.store.dispatch(requestDeleteTag(<any>{ tagId: this.tag.id }));
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
    }

    selectTag() {
        let value;
        if (!this.isId(this.id)) {
            value = this.id;
        } else if (this.isId(this.id)) {
            const set = new Set([this.id]);
            value = Array.from(set);
        }
        this.store.dispatch(
            setCurrentTagsFilters({
                currentTagsFilter: new Filter({ id: 1, label: "tags", value: value }),
            })
        );
    }

    selectTags() {
        let result: Array<string> | string;
        const value = this.tagsIds;
        if (value instanceof String) {
            result = this.id;
        } else if (value instanceof Set) {
            if (value.has(this.id)) {
                value.delete(this.id);
            } else {
                value.add(this.id);
            }
            result = Array.from(value);
        }
        this.store.dispatch(
            setCurrentTagsFilters({
                currentTagsFilter: new Filter({ id: 1, label: "tags", value: result }),
            })
        );
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    private isId(value: any): boolean {
        return value !== "allTasks" && value !== "allTags" && value !== "withoutTags" && typeof value === "string";
    }
}
