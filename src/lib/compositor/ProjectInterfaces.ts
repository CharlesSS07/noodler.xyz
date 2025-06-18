import type { ProjectInfo } from './ProjectModels.js';

export interface ProjectCollectionInterface<T extends object> {
    deleteProject(project_id: string): Promise<void>;

    newProject(projectName: string, projectDescription: string): Promise<T>;

    getProject(project_key: string): Promise<T>;
}
