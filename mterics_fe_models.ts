export enum MetricType {
    Time,
    Amount
}
export interface TimeSeriesEntity {
    key: number;    // X \\  Date
    value: number; //  Y  \\ Value
}

export interface MetricEntity { // One Query/Line of Metric
    title: string; // Legend
    description: string; // Now no Need
    timeSeries: TimeSeriesEntity[];
    hide: boolean; // Switch On/Off 
}

export interface MetricsEntity { // One Whole Metric
    metricMetaData: MetricMetaData;
    metrics: MetricEntity[];
    // hide: boolean; (Probably no need)
}

export interface MetricMetaData {
    name: string;
    title: string;
    description: string;
    order: number;
    type: MetricType;
}

export interface GetMetricPayload {
    metrics: string[];
    minDate: number;
    maxDate: number;
    aggregateSeconds: number;
}

export interface MetricsResponse {
    itemsTotal: number;
    items: MetricsEntity[];
}