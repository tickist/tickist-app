import { AbstractControl, ValidatorFn } from "@angular/forms";
import { ProjectLeftPanel } from "../../modules/projects-list/models/project-list";

export function forbiddenNamesValidator(projects: ProjectLeftPanel[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const index = projects.findIndex((project) => {
            const value = control.value.name ?? control.value;
            return project.id === value || project.name === value;
        });
        return index < 0 ? { forbiddenNames: { value: control.value } } : null;
    };
}
