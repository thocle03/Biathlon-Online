import Dexie, { type Table } from 'dexie';

export interface Competitor {
    id?: number;
    name: string;
    totalRaces: number;
    podiums: number;
    bestTime?: number; // in seconds
    bestPosition?: number;
}

export type EventStatus = 'active' | 'finished';
export type RaceMode = 'sprint' | 'pursuit' | 'relay' | 'individual';

export interface BiathlonEvent {
    id?: number;
    name: string;
    date: Date;
    level: number; // 1-5
    status: EventStatus;
    type: RaceMode; // new field
    startTime?: number; // Master timer start
}

export interface SplitTimes {
    start?: number; // Start Time
    lap1?: number; // Range 1 Entry
    shoot1?: number; // Range 1 Exit
    lap2?: number; // Range 2 Entry
    shoot2?: number; // Range 2 Exit
    lap3?: number;
    shoot3?: number;
    lap4?: number;
    shoot4?: number;
    finish?: number; // Finish Line
}

export interface ShootingScore {
    errors: number; // 0-5
}

export interface Race {
    id?: number;
    eventId: number;
    competitorId: number;
    opponentId?: number; // For duel
    mode: RaceMode;
    splits: SplitTimes;
    shooting1: ShootingScore; // Prone
    shooting2: ShootingScore; // Standing
    shooting3?: ShootingScore;
    shooting4?: ShootingScore;
    totalTime?: number; // Calculated with penalties
    penaltyCount: number;
    rank?: number;
    points?: number;
    startOffset?: number; // For Pursuit
}

export class BiathlonDB extends Dexie {
    competitors!: Table<Competitor>;
    events!: Table<BiathlonEvent>;
    races!: Table<Race>;

    constructor() {
        super('BiathlonDB');
        this.version(1).stores({
            competitors: '++id, name',
            events: '++id, date, status',
            races: '++id, eventId, competitorId, rank'
        });
        // Version 2: Add type index to events
        this.version(2).stores({
            competitors: '++id, name',
            events: '++id, date, status, type',
            races: '++id, eventId, competitorId, rank'
        });
    }
}

export const db = new BiathlonDB();
