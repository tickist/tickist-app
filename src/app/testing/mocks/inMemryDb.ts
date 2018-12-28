import {ParsedRequestUrl, RequestInfo, RequestInfoUtilities, ResponseOptions} from 'angular-in-memory-web-api/interfaces';
import {getStatusText, STATUS} from 'angular-in-memory-web-api/http-status-codes';
import {InMemoryDbService} from 'angular-in-memory-web-api';
import {UsersApiMockFactory} from './api-mock/users-api-mock.factory';
import {TagsApiMockFactory} from './api-mock/tags-api-mock.factory';
import {TasksApiMockFactory} from './api-mock/tasks-api-mock.factory';
import {ProjectsApiMockFactory} from './api-mock/projects-api-mock.factory';
import {ITaskApi} from '../../models/task-api.interface';
import {IUserApi} from '../../models/user-api.interface';
import {ISimpleUserApi} from '../../models/simple-user-api.interface';
import * as moment from 'moment';
import * as _ from 'lodash';


const NUMBERS_OF_USERS = 4;
const MAIN_USER_ID = 1;
const TAKEN_EMAIL = 'bill@tickist.com';


export class InMemoryDataService implements InMemoryDbService {
    usersApiMockFactory: UsersApiMockFactory;
    tagsApiMockFactory: TagsApiMockFactory;
    tasksApiMockFactory: TasksApiMockFactory;
    projectsApiMockFactory: ProjectsApiMockFactory;
    users: IUserApi[];
    teamList: ISimpleUserApi[];
    tasks: ITaskApi[] = [];
    dayStatistics: any = [];

    createDb() {
        this.usersApiMockFactory = new UsersApiMockFactory();
        this.users = this.usersApiMockFactory.createUsersDict(NUMBERS_OF_USERS);
        const loggedUser = this.users.find(user => user.id === MAIN_USER_ID);
        this.tagsApiMockFactory = new TagsApiMockFactory(loggedUser.id);
        this.tasksApiMockFactory = new TasksApiMockFactory();
        this.projectsApiMockFactory = new ProjectsApiMockFactory();

        const global = {
            all_tasks: {corrent_estimation: '0', suspend: 1, last_7th_days: 13, done: 159, undone: 1679, all: 1839}
        };
        this.teamList = this.users
            .map(user => UsersApiMockFactory.createSimpleUserFromUser(user));
        const tags = this.tagsApiMockFactory.createTagsDict();
        const projects = this.projectsApiMockFactory.createProjectsDict(this.teamList, loggedUser, tags);
        projects.forEach(project => {
            this.tasks.push(...this.tasksApiMockFactory.createTasksDict(loggedUser, loggedUser, project, []));
        });
        // add finish date to tasks
        this.tasks.map(task => {
            _.range(0, 6 + 1).forEach((number) => {
                if ((task.id % 17)  === number) {
                    task.finish_date = moment().add(number, 'days').format('DD-MM-YYYY');
                    task.finish_date_dateformat = moment().add(number, 'days').format('YYYY-MM-DD');
                }
            });
            if ((task.id % 17)  === 8) {
                task.finish_date = moment().add(-1, 'days').format('DD-MM-YYYY');
                task.finish_date_dateformat = moment().add(-1, 'days').format('YYYY-MM-DD');
            }
        });

        const authTokenApi = {
            access: 'Access token Api',
            refresh: 'Refresh token Api',
            user_id: 1
        };
        console.log(this.tasks);
        console.log({loggedUser});
        console.log({tags});
        console.log({projects});

        const charts = {
            'chart_max': 1543964400000,
            'time_chart': [{'spend_time': 0, 'est_time': 0, 'x': 1543446000000}, {
                'spend_time': 0,
                'est_time': 0,
                'x': 1543532400000
            }, {'spend_time': 0, 'est_time': 0, 'x': 1543618800000}, {'spend_time': 0, 'est_time': 0, 'x': 1543705200000}, {
                'spend_time': 0,
                'est_time': 0,
                'x': 1543791600000
            }, {'spend_time': 0, 'est_time': 0, 'x': 1543878000000}, {'spend_time': 0, 'est_time': 0, 'x': 1543964400000}],
            'chart_min': 1543446000000,
            'tasks_chart': [{'tasks_counter': 5, 'x': 1543446000000}, {'tasks_counter': 1, 'x': 1543532400000}, {
                'tasks_counter': 3,
                'x': 1543618800000
            }, {'tasks_counter': 0, 'x': 1543705200000}, {'tasks_counter': 2, 'x': 1543791600000}, {
                'tasks_counter': 0,
                'x': 1543878000000
            }, {'tasks_counter': 0, 'x': 1543964400000}]
        };
        this.dayStatistics = [{
            'date': {'value': '05-12-18'},
            'tasks_count': {'value': 22},
            'estimate_time': {'value': 15},
            'priorities': [{'count': 2, 'time': 15, 'color': '#cc324b', 'name': 'A'}, {
                'count': 16,
                'time': 0,
                'color': '#FF99B2',
                'name': 'B'
            }, {'count': 4, 'time': 0, 'color': '#ffffff', 'name': 'C'}],
            'tags': [{'count': 19, 'time': 15, 'name': 'Without tags'}, {
                'count': 2,
                'time': 0,
                'color': '#92629A',
                'name': 'Tag with computer'
            }, {'count': 1, 'time': 0, 'color': '#66CB2D', 'name': 'Tag the next action'}, {
                'count': 2,
                'time': 0,
                'color': '#D8F624',
                'name': 'Tag (sfw) safe for work'
            }],
            'lists': [{'count': 2, 'time': 0, 'color': '#ff2cf0', 'name': 'Opłaty'}, {
                'count': 1,
                'time': 0,
                'color': '#2c86ff',
                'name': 'Zadania domowe'
            }, {'count': 1, 'time': 0, 'color': '#2c86ff', 'name': 'Garaż - ewentualna możliwość zakupu'}, {
                'count': 9,
                'time': 0,
                'color': '#2c86ff',
                'name': 'Inbox'
            }, {'count': 2, 'time': 0, 'color': '#2c86ff', 'name': 'Sprzedaż Opla Astry'}, {
                'count': 1,
                'time': 0,
                'color': '#2c86ff',
                'name': 'Emerytura'
            }, {'count': 1, 'time': 0, 'color': '#fb7087', 'name': 'Rzeczy do zrobienia w domu'}, {
                'count': 3,
                'time': 0,
                'color': '#fcb150',
                'name': 'Organizacja życia'
            }, {'count': 1, 'time': 15, 'color': '#1c3923', 'name': 'Ekonomia klasyczna'}, {
                'count': 1,
                'time': 0,
                'color': '#f3df9a',
                'name': 'Zarządzanie finansami'
            }]
        }];
        // createInbox;
        // @TODO add function to create inbox

        return {
            global: global, tasks: this.tasks, project: projects, user: [loggedUser], charts: charts, day_statistics: this.dayStatistics,
            tag: tags, teamlist: this.teamList, 'api-token-auth': authTokenApi, registration: authTokenApi,
            checkteammember: {id: 1, name: 'Zero'}
        };
    }

    // HTTP GET interceptor
    get(reqInfo: RequestInfo) {
        console.log({reqInfo});
        if (reqInfo.url.includes('teamlist')) {
            return this.getTeamListResponse(reqInfo);
        } else if (reqInfo.url.includes('tasks')) {
            return this.getTasksResponse(reqInfo);
        } else if (reqInfo.url.includes(('day_statistics'))) {
            return this.getDayStatisticsResponse(reqInfo);
        }


        return undefined;
    }

    post(reqInfo: RequestInfo) {
        if (reqInfo.url.includes('api-token-auth')) {
            return this.postLoginUser(reqInfo);
        } else if (reqInfo.url.includes('check_email')) {
            return this.postCheckEmail(reqInfo);
        } else if (reqInfo.url.includes('registration')) {
            return this.postRegistration(reqInfo);
        }
        return undefined;
    }

    private postLoginUser(reqInfo) {
        return reqInfo.utils.createResponse$(() => {
            console.log('HTTP GET override');
            const dataEncapsulation = reqInfo.utils.getConfig().dataEncapsulation;
            const data = reqInfo.collection;
            const options: ResponseOptions = {
                body: dataEncapsulation ? {data} : data,
                status: STATUS.OK
            };
            return this.finishOptions(options, reqInfo);
        });
    }

    put(reqInfo: RequestInfo) {
        if (reqInfo.url.includes('tasks')) {
            return this.putTasksResponse(reqInfo);
        }
    }

    putTasksResponse(reqInfo: RequestInfo) {
        return reqInfo.utils.createResponse$(() => {
            console.log('HTTP GET override');
            const dataEncapsulation = reqInfo.utils.getConfig().dataEncapsulation;
            const data = TasksApiMockFactory.createResponseFromServer((<any> reqInfo.req).body);
            const options: ResponseOptions = {
                body: dataEncapsulation ? {data} : data,
                status: STATUS.OK
            };
            return this.finishOptions(options, reqInfo);
        });
    }

    private getDayStatisticsResponse(reqInfo: RequestInfo) {
        return reqInfo.utils.createResponse$(() => {
            console.log('HTTP GET override');

            const dataEncapsulation = reqInfo.utils.getConfig().dataEncapsulation;
            const data = JSON.parse(JSON.stringify(this.dayStatistics.find((dayStatistic: any) => dayStatistic.date.value === '05-12-18')));
            const options: ResponseOptions = {
                body: dataEncapsulation ? {data} : data,
                status: STATUS.OK
            };
            return this.finishOptions(options, reqInfo);
        });
    }

    private getTasksResponse(reqInfo: RequestInfo) {
        return reqInfo.utils.createResponse$(() => {
            console.log('HTTP GET override');

            const dataEncapsulation = reqInfo.utils.getConfig().dataEncapsulation;
            const data = JSON.parse(JSON.stringify(this.tasks.filter((task: ITaskApi) => task.status === 0)));
            const options: ResponseOptions = {
                body: dataEncapsulation ? {data} : data,
                status: STATUS.OK
            };
            return this.finishOptions(options, reqInfo);
        });
    }
    // HTTP GET interceptor handles requests for villains
    private getTeamListResponse(reqInfo: RequestInfo) {
        return reqInfo.utils.createResponse$(() => {
            console.log('HTTP GET override');

            const dataEncapsulation = reqInfo.utils.getConfig().dataEncapsulation;
            const data = JSON.parse(JSON.stringify(this.teamList));
            const options: ResponseOptions = {
                body: dataEncapsulation ? {data} : data,
                status: STATUS.OK
            };
            return this.finishOptions(options, reqInfo);
        });
    }

    private postCheckEmail(reqInfo: RequestInfo) {
        return reqInfo.utils.createResponse$(() => {
            console.log('HTTP GET override');
            const data = (<any> reqInfo).req.body.email === TAKEN_EMAIL ? {'is_taken': true} : {'is_taken': false};
            const options: ResponseOptions = {
                body: {data},
                status: STATUS.OK
            };
            return this.finishOptions(options, reqInfo);
        });
    }

    private postRegistration(reqInfo: RequestInfo) {
        return reqInfo.utils.createResponse$(() => {
            console.log('HTTP POST override');
            const dataEncapsulation = reqInfo.utils.getConfig().dataEncapsulation;
            const data = reqInfo.collection;
            const options: ResponseOptions = {
                body: dataEncapsulation ? {data} : data,
                status: STATUS.OK
            };
            return this.finishOptions(options, reqInfo);
        });
    }

    /////////// helpers ///////////////

    // intercept ResponseOptions from default HTTP method handlers
    // add a response header and report interception to console.log
    responseInterceptor(resOptions: ResponseOptions, reqInfo: RequestInfo) {

        resOptions.headers = resOptions.headers.set('x-test', 'test-header');
        const method = reqInfo.method.toUpperCase();
        const body = JSON.stringify(resOptions);
        console.log(`responseInterceptor: ${method} ${reqInfo.req.url}: \n${body}`);

        return resOptions;
    }


    private finishOptions(options: ResponseOptions, {headers, url}: RequestInfo) {
        options.statusText = getStatusText(options.status);
        options.headers = headers;
        options.url = url;
        return options;
    }
}
