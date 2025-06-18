export interface ProjectInfo {
    created_at: Date;
    last_updated_at: Date;
    title: string;
    invited_users: { [user_id: string]: boolean };
    show_tutorial: boolean;
    description: string;
    version: string;
    nodes: Record<string, unknown>;
}
