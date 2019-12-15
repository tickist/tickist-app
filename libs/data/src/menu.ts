export class Menu {
    isDescription;
    isSteps;
    isTags;
    isRepeat;
    isAssignedTo;
    isTaskProject;
    isFinishDate;

    constructor(menu: any = {}) {
        this.isDescription = menu.isDescription || false;
        this.isSteps = menu.isSteps || false;
        this.isTags = menu.isTags || false;
        this.isRepeat = menu.isRepeat || false;
        this.isAssignedTo = menu.isAssignedTo || false;
        this.isTaskProject = menu.isTaskProject || false;
        this.isFinishDate = menu.isFinishDate || false;
    }
}
