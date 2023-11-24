import { Task } from "@data";
import { Action, createReducer, on } from "@ngrx/store";
import { clearArchive, getArchivedTasks, saveToStore, startFetching, stopFetching } from "../actions/archive.actions";

export interface ArchiveState {
    isLoading: boolean;
    tasks: Task[];
}

export const initialState: ArchiveState = {
    isLoading: false,
    tasks: [],
};

const archiveReducer = createReducer(
    initialState,
    on(getArchivedTasks, () => ({
        isLoading: true,
        tasks: [],
    })),
    on(startFetching, (state) => ({
        isLoading: true,
        tasks: [...state.tasks],
    })),
    on(stopFetching, (state) => ({
        isLoading: false,
        tasks: [...state.tasks],
    })),
    on(saveToStore, (state, props) => ({
        isLoading: false,
        tasks: [...props.archivedTasks],
    })),
    on(clearArchive, () => ({
        isLoading: false,
        tasks: [],
    })),
);

export function reducer(state: ArchiveState, action: Action) {
    return archiveReducer(state, action);
}
