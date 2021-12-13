import { createEntityAdapter, EntityAdapter, EntityState } from "@ngrx/entity";
import {
    addProjects,
    createProject,
    deleteProject,
    updateProject,
} from "../../actions/projects/projects.actions";
import { Project } from "@data/projects";
import { resetStore } from "../../../tickist.actions";
import { Action, createReducer, on } from "@ngrx/store";

export interface ProjectsState extends EntityState<Project> {
    allProjectsLoaded: boolean;
}

export const adapter: EntityAdapter<Project> = createEntityAdapter<Project>();

export const initialProjectsState: ProjectsState = adapter.getInitialState({
    allProjectsLoaded: false,
});

const projectReducer = createReducer(
    initialProjectsState,
    on(createProject, (state, props) => adapter.addOne(props.project, state)),
    on(addProjects, (state, props) =>
        adapter.addMany(props.projects, { ...state, allProjectsLoaded: true })
    ),
    on(updateProject, (state, props) =>
        adapter.updateOne(props.project, state)
    ),
    on(deleteProject, (state, props) =>
        adapter.removeOne(props.projectId, state)
    ),
    on(resetStore, () => initialProjectsState)
);

export function reducer(state: ProjectsState, action: Action) {
    return projectReducer(state, action);
}

export const { selectAll, selectEntities, selectIds, selectTotal } =
    adapter.getSelectors();
