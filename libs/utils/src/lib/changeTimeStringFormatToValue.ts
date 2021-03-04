import {isNull} from "util";

export function changeTimeStringFormatToValue(timeString: string | null | undefined) {
    let onlyMinutes = 0;
    let result;
    if (timeString === null || timeString === undefined) return 0;
    timeString = timeString.replace(/ /g,'');
    if (timeString.search("h") > -1 && timeString.search("m") > -1) {
        const regex = new RegExp('(\\.*)(?<hours>[0-9]*)(\\s*)(h{1})(\\s*)(?<minutes>[0-9]+)(\\s*)m{1}(.*)')
        result = regex.exec(timeString)
        console.log(result?.groups)
        const hours = Number.isInteger(parseInt(result?.groups?.hours, 10)) ? parseInt(result?.groups?.hours, 10) : 0;
        const minutes = Number.isInteger(parseInt(result?.groups?.minutes, 10)) ? parseInt(result?.groups?.minutes, 10) : 0;
        onlyMinutes = hours * 60 + minutes
    } else if (timeString.search("h") === -1 && timeString.search("m") > -1) {
        const regex = new RegExp('(\\.*)(\\s*)(?<minutes>[0-9]+)(\\s*)m{0,1}(.*)')
        result = regex.exec(timeString)
        console.log(result?.groups)
        onlyMinutes = Number.isInteger(parseInt(result?.groups?.minutes, 10)) ? parseInt(result?.groups?.minutes, 10) : 0
    } else if (timeString.search("h") > -1 && timeString.search("m") === -1) {
        const regex = new RegExp('(\\.*)(?<hours>[0-9]*)(\\s*)(h{1})(.*)')
        result = regex.exec(timeString)
        console.log(result?.groups)
        const hours = Number.isInteger(parseInt(result?.groups?.hours, 10)) ? parseInt(result?.groups?.hours, 10) : 0
        onlyMinutes = hours * 60;
    } else if (timeString.search("h") === -1 && timeString.search("m") === -1) {
        const regex = new RegExp('(\\.*)(\\s*)(?<minutes>[0-9]+)(\\s*)(.*)')
        result = regex.exec(timeString)
        console.log(result?.groups)
        onlyMinutes = Number.isInteger(parseInt(result?.groups?.minutes, 10)) ? parseInt(result?.groups?.minutes, 10) : 0
    }

    return onlyMinutes;
}
