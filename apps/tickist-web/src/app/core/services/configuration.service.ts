import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppStore} from '../../store';
import {MediaObserver} from '@angular/flex-layout';
import * as configurationAction from '../../reducers/actions/configuration';
import {isOffline} from '../selectors/offline-notifications.selectors';
import {isLeftSideNavVisible} from '../selectors/sidenav-visibility.selectors';
import {showApiErrorBar} from "../actions/detect-api-error.actions";
import { updateLeftSidenavVisibility } from '../../reducers/actions/configuration';


@Injectable({
    providedIn: 'root',
})
export class ConfigurationService {
    offlineModeNotification$: Observable<any>;
    leftSidenavVisibility$: Observable<any>;
    configuration: {};
    TYPE_FINISH_DATE_ON: any;
    TYPE_FINISH_DATE_BY: any;

    constructor(private store: Store, protected media: MediaObserver) {
        this.offlineModeNotification$ = this.store.pipe(
            select(isOffline)
        );
        this.leftSidenavVisibility$ = this.store.pipe(
            select(isLeftSideNavVisible)
        );
        this.TYPE_FINISH_DATE_BY = {'id': 0, 'name': 'by'};
        this.TYPE_FINISH_DATE_ON = {'id': 1, 'name': 'on'};
        this.configuration = {
            'commons': {
                'DEFAULT_PRIORITY_OF_TASK': 'B',
                'DEFAULT_TYPE_FINISH_DATE': 0,
                'COLOR_LIST': ['#6be494', '#f3d749', '#fcb150', '#f3df9a', '#b6926e', '#2c86ff', '#4fc4f6', '#367cdc',
                    '#b679b2', '#be5753', '#fb7087', '#365D37', '#543562', '#FF0000', '#A8EF0E', '#CCFFE5', '#40E0D0',
                    '#B0E0E6', '#F5F5DC', '#FFFAFA', '#C0C0C0', '#C71585'],
                'CHOICES_DEFAULT_FINISH_DATE': [
                    {'id': null, 'name': 'not set'},
                    {'id': 0, 'name': 'today'},
                    {'id': 1, 'name': 'next day'},
                    {'id': 2, 'name': 'next week'},
                    {'id': 3, 'name': 'next month'}
                ],
                'OVERDUE_TASKS_SORT_BY_OPTIONS': [
                    {
                        'name': 'priority, finishDate, name',
                        'value': '{"fields": ["priority", "finishDate", "finishTime", "name"], "orders": ["asc", "asc", "asc", "asc"]}'
                    },
                    {
                        'name': 'priority, -finishDate, name',
                        'value': '{"fields": ["priority", "finishDate", "finishTime", "name"], "orders": ["asc", "desc", "desc", "asc"]}'
                    }
                ],
                'FUTURE_TASKS_SORT_BY_OPTIONS': [
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
                ],
                'TASKS_ORDER_OPTIONS': [
                    'Today->Overdue',
                    'Overdue->Today'
                ],
                'Google_plus_scope': 'https://www.googleapis.com/auth.effects.ts/plus.login ' +
                    'https://www.googleapis.com/auth.effects.ts/userinfo.email',
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
                'FROM_REPEATING_OPTIONS': [
                    {'id': 0, 'name': 'completion date'},
                    {'id': 1, 'name': 'due date'}
                ]
            }
        };
    }

    loadConfiguration() {
        return this.configuration;
    }

    updateDetectApiError(isVisible: boolean): void {
        this.store.dispatch(showApiErrorBar());
    }

    updateOfflineModeNotification(isActive: boolean): void {
        // this.store.dispatch(new configurationAction.UpdateOfflineModeNotification(isActive));
    }

    changeOpenStateLeftSidenavVisibility(state): void {
        let open;
        if (state === 'close') {
            open = false;
        } else if (state === 'open') {
            open = true;
        }
        this.store.dispatch(updateLeftSidenavVisibility({'open': open}));
    }

    updateLeftSidenavVisibility(): void {
        let open, position, mode;
        position = 'start';
        if (this.media.isActive('xs') || this.media.isActive('sm')) {
            open = false;
            mode = 'over';
        } else {
            mode = 'side';
            position = 'start';
            open = true;
        }
        this.store.dispatch(updateLeftSidenavVisibility({
            'position': position,
            'mode': mode,
            'open': open
        }));
    }

}
