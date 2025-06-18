import { child, push, ref, remove, serverTimestamp } from 'firebase/database';
import { auth, rtdb } from '../../firebase';
import { type ProjectCollectionInterface } from './ProjectInterfaces.js';

const projectsRef = ref(rtdb, 'fridge');

export interface FirebaseRTDBProjectKey {
    project_key: string;
}

export class FirebaseRTDBProjectCollection
    implements ProjectCollectionInterface<FirebaseRTDBProjectKey>
{
    private getProjectsRef() {
        return projectsRef;
    }

    private getProjectRef(project_key: string) {
        return child(this.getProjectsRef(), project_key);
    }

    async deleteProject(project_id: string) {
        try {
            await remove(this.getProjectRef(project_id));
        } catch (error) {
            console.error('Error deleting project: ', error);
            throw error;
        }
    }

    async newProject(projectName: string, projectDescription: string) {
        if (!projectName.trim())
            throw new Error('Project must be named and have a description');

        try {
            // console.log(auth.currentUser);
            if (auth.currentUser && auth.currentUser.uid !== null) {
                // logged in
                const invitedUsers = { [auth.currentUser.uid]: true }; // Updated invited_users format
                const pid = (
                    await push(this.getProjectsRef(), {
                        invited_users: invitedUsers,
                        created_at: serverTimestamp(),
                        last_updated_at: serverTimestamp(),
                        description: projectDescription,
                        nodes: [],
                        title: projectName,
                        version: '0.0.0',
                        show_tutorial: true, // Default value for the new field
                    })
                ).key;
                if (pid) return this.getProject(pid);
                throw new Error('RTDB Could not create new project.');
            } else {
                throw new Error('User not logged in');
            }
        } catch (error) {
            console.error('Error creating project: ', error);
            throw error;
        }
    }

    getProject(project_key: string): Promise<FirebaseRTDBProjectKey> {
        return new Promise((resolve) => resolve({ project_key: project_key }));
    }
}
