import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ForexSignal {
    id: bigint;
    validity: bigint;
    direction: string;
    pair: string;
    reversed: boolean;
    strength: number;
    timestamp: bigint;
    entryPrice: number;
    success?: boolean;
    market: string;
    exitPrice: number;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ForexStats {
    total: bigint;
    wins: bigint;
    losses: bigint;
    winRate: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface backendInterface {
    clearHistory(): Promise<void>;
    getAllSignals(): Promise<Array<ForexSignal>>;
    getForexCandles(pair: string, interval: string): Promise<string>;
    getForexPrice(pair: string): Promise<string>;
    getNewestSignalId(): Promise<bigint>;
    getOverallStats(): Promise<ForexStats>;
    getStatsByPair(pair: string, market: string): Promise<ForexStats>;
    saveSignal(pair: string, market: string, direction: string, strength: number, entryPrice: number, exitPrice: number, success: boolean | null, validity: bigint, reversed: boolean): Promise<bigint>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
