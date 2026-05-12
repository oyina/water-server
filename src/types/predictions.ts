//prediction
export interface PredictionRequest {
    lake: string,
    inputs: [number,number,number,number,number,number]
}

export interface PredictionRespose {
    level: number,
    timestamp: string
}