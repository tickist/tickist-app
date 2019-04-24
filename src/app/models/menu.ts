export class Menu {
    private _isDescription;
    private _isSteps;
    private _isTags;
    private _isRepeat;
    private _isAssignedTo;
    private _isTaskProject;
    private _isFinishDate;

    constructor(menu: any = {}) {
        this._isDescription = menu.isDescription || false;
        this._isSteps = menu.isSteps || false;
        this._isTags = menu.isTags || false;
        this._isRepeat = menu.isRepeat || false;
        this._isAssignedTo = menu.isAssignedTo || false;
        this._isTaskProject = menu.isTaskProject || false;
        this._isFinishDate = menu.isFinishDate || false;
    }

    get isDescription() {
        return this._isDescription;
    }

    set isDescription(newValue: boolean) {
        this._isDescription = newValue;
    }

    get isSteps() {
        return this._isSteps;
    }

    set isSteps(newValue: boolean) {
        this._isSteps = newValue;
    }

    get isTags() {
        return this._isTags;
    }

    set isTags(newValue: boolean) {
        this._isTags = newValue;
    }

    get isRepeat() {
        return this._isRepeat;
    }

    set isRepeat(newValue: boolean) {
        this._isRepeat = newValue;
    }

    get isAssignedTo() {
        return this._isAssignedTo;
    }

    set isAssignedTo(newValue: boolean) {
        this._isAssignedTo = newValue;
    }

    get isTaskProject() {
        return this._isTaskProject;
    }

    set isTaskProject(newValue: boolean) {
        this._isTaskProject = newValue;
    }

    get isFinishDate() {
        return this._isFinishDate;
    }

    set isFinishDate(newValue: boolean) {
        this._isFinishDate = newValue;
    }

    isAtLeastOneMenuElementEnabled(): boolean {
        let result = false;
        for (const prop in this) {
            if (this.hasOwnProperty(prop) && this[prop]) {
                result = true;
                break;
            }
        }
        return result;
    }



}
