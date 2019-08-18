class SimpleTag {
    name: string;
    count: number;
    estimatedTime: number;
    color: string;

    constructor(tag) {
        this.name = tag.name;
        this.count = tag.count;
        this.estimatedTime = tag.time;
        this.color = tag.color;
    }
}

class SimpleList {
    name: string;
    count: number;
    estimatedTime: number;
    color: string;

    constructor(list) {
        this.name = list.name;
        this.count = list.count;
        this.estimatedTime = list.time;
        this.color = list.color;
    }
}

class SimplePriority {
    name: string;
    count: number;
    estimatedTime: number;
    color: string;

    constructor(list) {
        this.name = list.name;
        this.count = list.count;
        this.estimatedTime = list.time;
        this.color = list.color;
    }
}


export class DailyStatistics {
    date: Date;
    estimatedTime: number;
    tasksCount: number;
    lists: SimpleList[] = [];
    tags: SimpleTag[] = [];
    priorities: SimplePriority[] = [];


    constructor(apiObject) {
        this.date = apiObject.date;
        this.estimatedTime = apiObject.estimate_time;
        this.tasksCount = apiObject.tasks_count;
        apiObject.lists.forEach((list) => {
            this.lists.push(new SimpleList(list));
        });

        apiObject.tags.forEach((tag) => {
            this.tags.push(new SimpleTag(tag));
        });
        apiObject.priorities.forEach((priority) => {
            this.priorities.push(new SimplePriority(priority));
        });


    }
}

export class GlobalStatistics {
    all: number;
    suspend: number;
    last7thDays: number;
    currentEstimation: number;
    undone: number;
    done: number;

    constructor(apiObject) {
        this.all = apiObject.all_tasks.all;
        this.suspend = apiObject.all_tasks.suspend;
        this.last7thDays = apiObject.all_tasks.last_7th_days;
        this.currentEstimation = apiObject.all_tasks.current_estimation;
        this.undone = apiObject.all_tasks.undone;
        this.done = apiObject.all_tasks.done;

    }

}

class TaskChartElem {
    x: number;
    tasksCounter: number;

    constructor(elem) {
        this.x = elem.x;
        this.tasksCounter = elem.tasks_counter;
    }
}


class TimeChartElem {
    x: number;
    estimateTime: number;
    time: number;

    constructor(elem) {
        this.x = elem.x;
        this.estimateTime = elem.est_time;
        this.time = elem.spend_time;
    }
}

export class ChartStatistics {
    chartMax: number;
    chartMin: number;
    tasksChart: TaskChartElem[] = [];
    timeChart: TimeChartElem[] = [];

    constructor(apiObject) {
        this.chartMax = apiObject.chart_max;
        this.chartMin = apiObject.chart_min;
        apiObject.tasks_chart.forEach((elem) => {
            this.tasksChart.push(new TaskChartElem(elem));

        });
        apiObject.time_chart.forEach((elem) => {
            this.timeChart.push(new TimeChartElem(elem));
        });


    }


}
