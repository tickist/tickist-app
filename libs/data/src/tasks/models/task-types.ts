export enum TaskType {
    normal = "Normal",
    nextAction = "Next action",
    needInfo = "Need info",
}

export const AVAILABLE_TASK_TYPES = [
    TaskType.normal,
    TaskType.needInfo,
    TaskType.nextAction,
];
export const AVAILABLE_TASK_TYPES_ICONS = [
    ["far", "square"],
    ["fas", "mug-hot"],
    ["fas", "project-diagram"],
];
