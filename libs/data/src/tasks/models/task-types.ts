export enum TaskType {
    NORMAL = "Normal",
    NEXT_ACTION = "Next action",
    NEED_INFO = "Need info",
}


export const AVAILABLE_TASK_TYPES = [TaskType.NORMAL, TaskType.NEED_INFO, TaskType.NEXT_ACTION]
export const AVAILABLE_TASK_TYPES_ICONS = [['fas', 'project-diagram'], ['fas', 'mug-hot'],['far', 'square']]
