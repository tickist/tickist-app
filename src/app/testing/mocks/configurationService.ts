import {SpyObject} from '../test.helpers';
import {ConfigurationService} from '../../services/configurationService';
import {of} from 'rxjs';


export class MockConfigurationService extends SpyObject {
    fakeResponse;
    responseSuccess: boolean;
    loadConfiguration: any;
    activeDay$: any;
    offlineModeNotification$: any;
    detectApiError$: any;
    addTaskComponentVisibility$: any;
    leftSidenavVisibility$: any;
    rightSidenavVisibility$: any;
    mockConfiguration: any;
    addTaskComponentVisibilityResponse: boolean;
    TASK_EXTENDED_VIEW: any;
    TASK_SIMPLE_VIEW: any;
    TYPE_FINISH_DATE_BY: any;
    TYPE_FINISH_DATE_ON: any;

    constructor() {
        super(ConfigurationService);
        this.TASK_EXTENDED_VIEW = {'name': 'extended view', 'value': 'extended'};
        this.TASK_SIMPLE_VIEW = {'name': 'simple view', 'value': 'simple'};
        this.TYPE_FINISH_DATE_BY = {'id': 0, 'name': 'by'};
        this.TYPE_FINISH_DATE_ON = {'id': 1, 'name': 'on'};
        this.mockConfiguration = {
            'commons': {
                'DEFAULT_PRIORITY_OF_TASK': 'B',
                'DEFAULT_TYPE_FINISH_DATE': 0,
                'COLOR_LIST_DEFAULT': '#2c86ff',
                'COLOR_LIST': ['#6be494', '#f3d749', '#fcb150', '#f3df9a', '#b6926e', '#2c86ff', '#4fc4f6', '#367cdc',
                    '#b679b2', '#be5753', '#fb7087'],
                'CHOICES_DEFAULT_FINISH_DATE': [
                    {'id': 0, 'name': 'today'},
                    {'id': 1, 'name': 'next day'},
                    {'id': 2, 'name': 'next week'},
                    {'id': 3, 'name': 'next month'}
                ],
                'OVERDUE_TASKS_SORT_BY_OPTIONS': [
                    {
                        'name': 'priority, finishDate, name',
                        'value': '{"fields": ["priority", "finishDate", "name"], "orders": ["asc", "asc", "asc"]}'
                    },
                    {
                        'name': 'priority, -finishDate, name',
                        'value': '{"fields": ["priority", "finishDate", "name"], "orders": ["asc", "desc", "asc"]}'
                    }
                ],
                'FUTURE_TASKS_SORT_BY_OPTIONS': [
                    {
                        'name': 'finishDate, finishTime, name',
                        'value': '{"fields": ["finishDate", "finishTime", "name"], "orders": ["desc", "asc", "asc"]}'
                    },
                    {
                        'name': '-finishDate, finishTime, name',
                        'value': '{"fields": ["finishDate", "finishTime", "name"], "orders": ["asc", "desc", "asc"]}'
                    }
                ],
                'TASKS_ORDER_OPTIONS': [
                    'Today->Overdue->You can do this too',
                    'Overdue->Today->You can do this too'
                ],
                'DEFAULT_TASK_VIEW_OPTIONS': [
                    this.TASK_EXTENDED_VIEW,
                    this.TASK_SIMPLE_VIEW
                ],
                'STATIC_URL': '/site_media/static/',
                'Google_plus_scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email',
                'DEFAULT_REPEAT_OPTIONS': [
                    {'name_of_extension': '', 'id': 0, 'name': 'never'},
                    {'name_of_extension': 'day(s)', 'id': 1, 'name': 'daily'},
                    {'name_of_extension': 'workday(s)', 'id': 2, 'name': 'daily (workweek)'},
                    {'name_of_extension': 'week(s)', 'id': 3, 'name': 'weekly'},
                    {'name_of_extension': 'month(s)', 'id': 4, 'name': 'monthly'},
                    {'name_of_extension': 'year(s)', 'id': 5, 'name': 'yearly'}
                ],
                'CUSTOM_REPEAT_OPTIONS': [
                    {'name_of_extension': 'day(s)', 'id': 1, 'name': 'daily'},
                    {'name_of_extension': 'workday(s)', 'id': 2, 'name': 'daily (workweek)'},
                    {'name_of_extension': 'week(s)', 'id': 3, 'name': 'weekly'},
                    {'name_of_extension': 'month(s)', 'id': 4, 'name': 'monthly'},
                    {'name_of_extension': 'year(s)', 'id': 5, 'name': 'yearly'}
                ],
                'TYPE_FINISH_DATE_OPTIONS': [
                    {'id': 0, 'name': 'by'},
                    {'id': 1, 'name': 'on'}
                ],
                'Google_plus_client_id': '10075871005-82p837k1phngal0dieovqg5e2cunnhoa.apps.googleusercontent.com',
                'FROM_REPEATING_OPTIONS': [
                    {'id': 0, 'name': 'completion date'},
                    {'id': 1, 'name': 'due date'}
                ],
                'SOCIAL_AUTH_FACEBOOK_KEY': '325210257603853',
                'MEDIA_URL': '/uploaded/',
                'FACEBOOK_FANPAGE': 'https://www.facebook.com/Tickist',
                'GOOGLE_PLUS': 'https://google.com/+Tickist',
                'TWITTER': 'https://twitter.com/tickist'
            }
        };
        this.loadConfiguration = this.spy('loadConfiguration').and.returnValue(this.mockConfiguration);
        this.fakeResponse = null;
        this.responseSuccess = true;
        this.activeDay$ = this.spy('activeDay$').and.returnValue(this);
        this.offlineModeNotification$ = this.spy('offlineModeNotification$').and.returnValue(of(this.fakeResponse));
        this.detectApiError$ = this.spy('detectApiError$').and.returnValue(of(this.fakeResponse));
        this.leftSidenavVisibility$ = of(this.fakeResponse);
        this.rightSidenavVisibility$ = of(this.fakeResponse);
        this.addTaskComponentVisibility$ = of(this.addTaskComponentVisibilityResponse);
        this.activeDay$ = of(this.fakeResponse);
    }

    subscribe(success, error) {
        if (this.responseSuccess) {
            success(this.fakeResponse);
        } else {
            error(this.fakeResponse);
        }
    }

    takeUntil() {
        return this;
    }

    setErrorResponse() {
        this.responseSuccess = false;
    }

    setResponse(json: any): void {
        this.fakeResponse = json;
    }

    setAddTaskComponentVisibilityResponse(response: boolean): void {
        this.addTaskComponentVisibility$ = of(response);
    }

    getProviders(): Array<any> {
        return [{provide: ConfigurationService, useValue: this}];
    }
}
