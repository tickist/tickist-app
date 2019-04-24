import {toSnakeCase} from './toSnakeCase';
import {User} from '../models';
import {IUserApi} from '../../models/user-api.interface';

export function userToSnakeCase(user: User): IUserApi {
    const result = <IUserApi> toSnakeCase(user);

    if (user.dailySummaryHour) {
        const hour = user.dailySummaryHour.getHours();
        const minute = user.dailySummaryHour.getMinutes();
        const second = user.dailySummaryHour.getSeconds();
        const hourFormatted = hour < 10 ? '0' + hour : hour;
        const minuteFormatted = minute < 10 ? '0' + minute : minute;
        const secondFormatted = second < 10 ? '0' + second : second;
        result['daily_summary_hour'] = `${hourFormatted}:${minuteFormatted}:${secondFormatted}`;
    }
    return result;
}
