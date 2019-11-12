export const DEFAULT_COLOR_LIST = '#2c86ff';
export const DEFAULT_PRIORITY = 'C';
const TASK_EXTENDED_VIEW = {'name': 'extended view', 'value': 'extended'};
const TASK_SIMPLE_VIEW = {'name': 'simple view', 'value': 'simple'};
export const DEFAULT_TASK_VIEW = TASK_EXTENDED_VIEW;

export const DEFAULT_DIALOG_TIME_WHEN_TASK_FINISHED = false;
export const TYPE_FINISH_DATE_OPTIONS = [
    {'id': 0, 'name': 'by'},
    {'id': 1, 'name': 'on'}
];

export const DEFAULT_TYPE_FINISH_DATE = TYPE_FINISH_DATE_OPTIONS[0].id;
export const CHOICES_DEFAULT_FINISH_DATE = [
    {'id': null, 'name': 'not set'},
    {'id': 0, 'name': 'today'},
    {'id': 1, 'name': 'next day'},
    {'id': 2, 'name': 'next week'},
    {'id': 3, 'name': 'next month'}
];

export const DEFAULT_FINISH_DATE = CHOICES_DEFAULT_FINISH_DATE[0].id;
