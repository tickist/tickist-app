import {SpyObject} from '../test.helpers';
import {ConfigurationService} from "../../services/configurationService";



export class MockConfigurationService extends SpyObject {
  fakeResponse;
  responseSuccess: boolean;
  loadConfiguration: any;
  mockConfiguration =  {
      "commons": {
        "COLOR_LIST_DEFAULT": "#2c86ff",
        "COLOR_LIST": ["#6be494", "#f3d749", "#fcb150", "#f3df9a", "#b6926e", "#2c86ff", "#4fc4f6", "#367cdc", "#b679b2", "#be5753", "#fb7087"],
        "CHOICES_DEFAULT_FINISH_DATE": [{"id": 0, "name": "today"}, {"id": 1, "name": "tomorrow"}, {
          "id": 2,
          "name": "next week"
        }],
        "TASKS_ORDER_OPTIONS": [
          "Today->Overdue->You can do this too",
          "Overdue->Today->You can do this too"
        ],
        "DEFAULT_TASK_VIEW_OPTIONS": [{'name': 'extended'}, {'name': 'simple'}],
        "Google_plus_scope": "https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email",
        "DEFAULT_REPEAT_OPTIONS": [{"name_of_extension": "", "id": 0, "name": "never"}, {
          "name_of_extension": "day(s)",
          "id": 1,
          "name": "daily"
        }, {"name_of_extension": "week(s)", "id": 3, "name": "weekly"}, {
          "name_of_extension": "month(s)",
          "id": 4,
          "name": "monthly"
        }, {"name_of_extension": "year(s)", "id": 5, "name": "yearly"}],

        "CUSTOM_REPEAT_OPTIONS": [{
          "name_of_extension": "day(s)",
          "id": 1,
          "name": "daily"
        }, {
          "name_of_extension": "workday(s)",
          "id": 2,
          "name": "daily (workweek)"
        }, {"name_of_extension": "week(s)", "id": 3, "name": "weekly"}, {
          "name_of_extension": "month(s)",
          "id": 4,
          "name": "monthly"
        }, {"name_of_extension": "year(s)", "id": 5, "name": "yearly"}],
        "TYPE_FINISH_DATE_OPTIONS": [{"id": 0, "name": "by"}, {"id": 1, "name": "on"}],
        "Google_plus_client_id": "10075871005-82p837k1phngal0dieovqg5e2cunnhoa.apps.googleusercontent.com",
        "FROM_REPEATING_OPTIONS": [{"id": 0, "name": "completion date"}, {"id": 1, "name": "due date"}],
        "SOCIAL_AUTH_FACEBOOK_KEY": "325210257603853",
        "MEDIA_URL": "/uploaded/",
        'FACEBOOK_FANPAGE': 'https://www.facebook.com/Tickist',
        'GOOGLE_PLUS': 'https://google.com/+Tickist',
        'TWITTER': 'https://twitter.com/tickist'
      }
    };

  constructor() {
    super(ConfigurationService);
    this.loadConfiguration = this.spy('loadConfiguration').and.returnValue(this.mockConfiguration);
    this.fakeResponse = null;
    this.responseSuccess = true;
  }

  subscribe(success, error) {
    if (this.responseSuccess) {
      success(this.fakeResponse);
    } else {
      error(this.fakeResponse);
    }
  }

  setErrorResponse() {
    this.responseSuccess = false;
  }

  setResponse(json: any): void {
    this.fakeResponse = json;
  }

  getProviders(): Array<any> {
    return [{provide: ConfigurationService, useValue: this}];
  }
}
