export const OVERDUE_TASKS_SORT_BY_OPTIONS = [
    {
        'name': 'priority, finishDate, name',
        'value': '{"fields": ["priority", "finishDate", "finishTime", "name"], "orders": ["asc", "asc", "asc", "asc"]}'
    },
    {
        'name': 'priority, -finishDate, name',
        'value': '{"fields": ["priority", "finishDate", "finishTime", "name"], "orders": ["asc", "desc", "desc", "asc"]}'
    }
];


export const FUTURE_TASKS_SORT_BY_OPTIONS = [
    {
        'name': 'finishDate, finishTime, name',
        'value': '{"fields": ["finishDate", "finishTime", "name"], "orders": ["desc", "asc", "asc"]}'
    },
    {
        'name': 'priority finishDate, finishTime, name',
        'value': '{"fields": ["priority", "finishDate", "finishTime", "name"], "orders": ["asc", "desc", "asc", "asc"]}'
    },
    {
        'name': '-finishDate, finishTime, name',
        'value': '{"fields": ["finishDate", "finishTime", "name"], "orders": ["asc", "desc", "asc"]}'
    }
];

export const DEFAULT_FUTURE_TASKS_SORT_BY = FUTURE_TASKS_SORT_BY_OPTIONS[0].value;
export const DEFAULT_OVERDUE_TASKS_SORT_BY = OVERDUE_TASKS_SORT_BY_OPTIONS [0].value;
export const DEFAULT_PROJECTS_FILTER_ID = 1;
export const DEFAULT_TAGS_FILTER_ID = 1;

export const DEFAULT_DIALOG_TIME_WHEN_TASK_FINISHED_IN_PROJECT = false;

export const TASKS_ORDER_OPTIONS = [
    'Today->Overdue',
    'Overdue->Today'
];

export const DEFAULT_TASKS_ORDER_OPTIONS = TASKS_ORDER_OPTIONS[0];
export const DEFAULT_DAILY_SUMMARY_HOUR = '07:00';
export const DEFAULT_USER_AVATAR = '/assets/images/default_images/default_avatar_user.png';
export const USER_AVATAR_PATH = '/images/avatars/';
