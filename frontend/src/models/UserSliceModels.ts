interface User {
  devStacks: any;
  id: string;
  email: string;
  username: string;
  job_title: string;
  is_developper: boolean;
  is_admin: boolean;
  password: string | null;

  developpersStack: DeveloppersStack[];
  projectDevelopers: ProjectDeveloper[];
  Sprint_developpers: SprintDeveloper[];
  tasks: Task[];
  notifications: Notification[];
}

interface DeveloppersStack {
  id: string;
  devStackId: string;
  userId: string;
  dev_stack: DevStack;
}

interface DevStack {
  id: string;
  framework: string;
  programming_language: string;
  version?: string;
}

interface ProjectDeveloper {
  id: string;
  is_lead: boolean;
  userId: string;
  projectId: string;
  project: Project;
}

interface SprintDeveloper {
  id: string;
  is_lead: boolean;
  userId: string;
  sprintId: string;
}

interface Task {
  id: string;
  designation: string;
  description?: string;
  start_date: string;
  end_date?: string;
  finished_at?: string;
  status: number;
}

interface Notification {
  id: string;
  message: string;
  type: string;
  entityId: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
}

interface Project {
  id: string;
  name?: string;
  description?: string;
  quartierId: string;
}

export type {
  Project,
  ProjectDeveloper,
  DevStack,
  User,
  DeveloppersStack,
  SprintDeveloper,
  Task,
  Notification,
};
