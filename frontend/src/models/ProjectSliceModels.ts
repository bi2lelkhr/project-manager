export interface User {
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

export interface DeveloppersStack {
  id: string;
  userId: string;
  devStackId: string;
  created_at?: string;
  updated_at?: string;
  dev_stack?: DevStack;
  user?: User;
}

export interface DevStack {
  id: string;
  framework: string;
  programming_language: string;
  version?: string;
}

export interface ProjectDeveloper {
  id: string;
  is_lead: boolean;
  userId: string;
  projectId: string;
  user: User;
  project: Project;
}

export interface Zone {
  id: string;
  code_zone: string;
  nom: string;
  description?: string;
  quartiers: Quartier[];
}

export interface Quartier {
  id: string;
  code_quartier: string;
  nom: string;
  description?: string;
  zoneId: string;
  zone: Zone;
  Project: Project[];
}

export interface Noeud {
  id: string;
  designation: string;
  description?: string;
  repository_link?: string;
  typeNoeudId: string;
  devStackId: string;
  projectId: string;
  network?: string;

  dev_stack: DevStack;
  project: Project;
  type_noeud: TypeNoeud;
  Infrastructure: Infrastructure[];
}

export interface Infrastructure {
  id: string;
  noeudId: string;
  network: string;
  port: number;
  in_out: string;
  protocol: string;
}

export interface TypeNoeud {
  id: string;
  designation?: string;
  description?: string;
  noeuds: Noeud[];
}

export interface Project {
  id: string;
  name?: string;
  description?: string;
  quartierId: string;

  quartier: Quartier;
  deploiments: Deploiement[];
  noeuds: Noeud[];
  projectDevelopers: ProjectDeveloper[];
  projectsRisques: ProjectRisque[];
  sprints: Sprint[];
}

export interface Risque {
  id: string;
  name: string;
  description: string | null;
  severity: number;
  Projects_risques: ProjectRisque[];
}


export interface ProjectRisque {
  id: string;
  projectId: string;
  risqueId: string;
  project?: Project;
  risque?: Risque;
}


export interface Sprint {
  id: string;
  sprint_name: string;
  start_date: string;
  end_date?: string;
  finished_at?: string;
  status: number;
  projectId?: string;

  project?: Project;
  Sprint_developpers: SprintDeveloper[];
  tasks: Task[];
}

export interface SprintDeveloper {
  id: string;
  is_lead: boolean;
  userId: string;
  sprintId: string;
  sprint: Sprint;
  user: User;
}

export interface Task {
  id: string;
  designation: string;
  description?: string;
  start_date: string;
  end_date?: string;
  finished_at?: string;
  status: number;
  developerId?: string;
  sprintId?: string;

  developer?: User;
  sprint?: Sprint;
}

export interface Deploiement {
  id: string;
  type: string;
  link?: string;
  repository?: string;
  is_alive?: string;
  projectId: string;
  project: Project;
  DeployHistory: DeployHistory[];
}

export interface DeployHistory {
  id: string;
  deploimentId: string;
  commit: string;
  date_dep: string;
  author?: string;
  is_success: boolean;
}

export interface Notification {
  id: string;
  message: string;
  type: string;
  entityId: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
}
