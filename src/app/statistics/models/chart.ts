export class Chart {
    id: number;
    name: string;
    data: any;
    legend: Array<any>;


    constructor(chart) {
        this.id = chart.id;
        this.name = chart.name;
        this.data = chart.data;
        this.legend = chart.legend;
    }
}
