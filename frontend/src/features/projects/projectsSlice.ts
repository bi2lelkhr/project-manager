import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../constantes";
import { baseQueryWithReauth } from "../services/baseQuery";
import { User } from "../../models/UserSliceModels";
import {
  Deploiement,
  DeployHistory,
  Infrastructure,
  Noeud,
  Project,
  Quartier,
  Risque,
  Sprint,
  Task,
  Zone,
  ProjectRisque,
  DevStack,
  DeveloppersStack,
  TypeNoeud,
} from "../../models/ProjectSliceModels";
import { ProjectFormData } from "../../pages/Projects";
import { RisqueFormData } from "../../pages/Risques";
import { TaskFormData } from "../../pages/Board";
import { SprintFormData } from "../../pages/Sprints";
import { DeploiementFormData } from "../../pages/Deploiments";
import { InfrastructureFormData } from "../../pages/Infrastructure";

export interface StandardReponse {
  success: boolean;
  message: string;
}
export interface Credential {
  token: string;
  role: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    job_title: string;
    is_developper: boolean;
    is_admin: boolean;
  };
}
interface LogoutResponse {
  success: boolean;
}

export interface NoeudFormData {
  id?: string;
  designation: string;
  description?: string;
  repository_link?: string;
  typeNoeudId: string;
  devStackId: string;
  projectId: string;
  network?: string;
}

export interface UnassignDevFromStackData {
  devStackId: string;
  userId: string;
}

export interface DevStackFormData {
  id?: string;
  framework: string;
  programming_language: string;
  version?: string;
}

export interface AssignDevToStackData {
  devStackId: string;
  userId: string;
}

export interface TypeNoeudFormData {
  id?: string;
  designation: string;
  description?: string;
}

export interface ProjectSprintsResponse {
  project: string;
  sprints: Sprint[];
}

export const projectSlice = createApi({
  reducerPath: "project",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Zone",
    "Quartier",
    "Project",
    "Risque",
    "Sprint",
    "Task",
    "Deploiement",
    "Noeud",
    "Infrastructure",
    "Notification",
    "DeployHistory",
    "ProjectRisque",
    "DevStack",
    "DeveloppersStack",
    "TypeNoeud",
  ],
  endpoints: (builder) => ({
  
    addZone: builder.mutation<
      StandardReponse,
      { code_zone: string; nom: string; description?: string }
    >({
      query: (zone) => ({
        url: "zones",
        method: "post",
        body: zone,
      }),
      invalidatesTags: ["Zone"],
    }),
    addQuartier: builder.mutation<
      StandardReponse,
      {
        code_quartier: string;
        nom: string;
        description: string | null;
        zoneId: string;
      }
    >({
      query: (quartier) => ({
        url: "quartiers",
        method: "post",
        body: quartier,
      }),
      invalidatesTags: ["Quartier"],
    }),
    addProject: builder.mutation<StandardReponse, ProjectFormData>({
      query: (project) => ({
        url: "projects",
        method: "post",
        body: project,
      }),
      invalidatesTags: ["Project"],
    }),
    addRisque: builder.mutation<StandardReponse, RisqueFormData>({
      query: (risque) => ({
        url: "risques",
        method: "post",
        body: risque,
      }),
      invalidatesTags: ["Risque"],
    }),
    addTask: builder.mutation<StandardReponse, TaskFormData>({
      query: (task) => ({
        url: `sprints/tasks/attach-to-sprint/${task.sprintId}`,
        method: "post",
        body: task,
      }),
      invalidatesTags: ["Task", "Sprint"],
    }),
    addSprint: builder.mutation<
      StandardReponse,
      { projectId: string; data: SprintFormData }
    >({
      query: ({ projectId, data }) => ({
        url: `sprints/${projectId}`,
        method: "post",
        body: data,
      }),
      invalidatesTags: ["Sprint", "Project"],
    }),

    addDeploiement: builder.mutation<StandardReponse, DeploiementFormData>({
      query: (deploiement) => ({
        url: "deploiments",
        method: "post",
        body: deploiement,
      }),
      invalidatesTags: ["Deploiement"],
    }),

    
    addNoeud: builder.mutation<StandardReponse, NoeudFormData>({
      query: (noeud) => ({
        url: `noeuds/${noeud.projectId}`,
        method: "post",
        body: noeud,
      }),
      invalidatesTags: ["Noeud", "Project"],
    }),

    fetchAllNoeuds: builder.query<Noeud[], void>({
      query: () => ({
        url: "noeuds",
        method: "get",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Noeud" as const, id })),
              "Noeud",
            ]
          : ["Noeud"],
    }),

    fetchNoeudsByProject: builder.query<Noeud[], { projectId: string }>({
      query: ({ projectId }) => ({
        url: `noeuds/${projectId}`,
        method: "get",
      }),
      providesTags: (result, error, { projectId }) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Noeud" as const, id })),
              { type: "Noeud", id: projectId },
            ]
          : [{ type: "Noeud", id: projectId }],
    }),

    updateNoeud: builder.mutation<StandardReponse, NoeudFormData>({
      query: (noeud) => ({
        url: `noeuds/${noeud.id}`,
        method: "put",
        body: noeud,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Noeud", id },
        "Noeud",
      ],
    }),

    deleteNoeud: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `noeuds/${id}`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Noeud", id },
        "Noeud",
      ],
    }),

    fetchInfrastructuresByNoeud: builder.query<
      Infrastructure[],
      { noeudId: string }
    >({
      query: ({ noeudId }) => ({
        url: `noeuds/infrastructure/${noeudId}`,
        method: "get",
      }),
      transformResponse: (response: {
        success: boolean;
        data: Infrastructure[];
      }) => response.data,
      providesTags: (result, error, { noeudId }) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Infrastructure" as const,
                id,
              })),
              { type: "Infrastructure", id: noeudId },
            ]
          : [{ type: "Infrastructure", id: noeudId }],
    }),

  
    addDevStack: builder.mutation<StandardReponse, DevStackFormData>({
      query: (devStack) => ({
        url: "dev-stacks",
        method: "post",
        body: devStack,
      }),
      invalidatesTags: ["DevStack"],
    }),

    fetchAllDevStacks: builder.query<DevStack[], void>({
      query: () => ({
        url: "dev-stacks",
        method: "get",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "DevStack" as const, id })),
              "DevStack",
            ]
          : ["DevStack"],
    }),

    updateDevStack: builder.mutation<StandardReponse, DevStackFormData>({
      query: (devStack) => ({
        url: `dev-stacks/${devStack.id}`,
        method: "put",
        body: devStack,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "DevStack", id },
        "DevStack",
      ],
    }),

    deleteDevStack: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `dev-stacks/stack/${id}`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "DevStack", id },
        "DevStack",
        "DeveloppersStack",
      ],
    }),

    assignDevToStack: builder.mutation<StandardReponse, AssignDevToStackData>({
      query: (data) => ({
        url: "dev-stacks/assign_stack",
        method: "post",
        body: data,
      }),
      invalidatesTags: ["DeveloppersStack", "DevStack"],
    }),

    unassignDevFromStack: builder.mutation<
      StandardReponse,
      UnassignDevFromStackData
    >({
      query: (data) => ({
        url: "dev-stacks/remove_stack",
        method: "delete",
        body: data,
      }),
      invalidatesTags: ["DeveloppersStack", "DevStack"],
    }),

    // Frontend
    fetchDevStacksByDeveloper: builder.query<
      DeveloppersStack[],
      { userId: string }
    >({
      query: ({ userId }) => ({
        url: `dev-stacks/developper/${userId}`,
        method: "GET",
      }),
      providesTags: (result, error, { userId }) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "DeveloppersStack" as const,
                id,
              })),
              { type: "DeveloppersStack", id: userId },
            ]
          : [{ type: "DeveloppersStack", id: userId }],
      // Add error handling
      keepUnusedDataFor: 60, // Cache for 60 seconds
    }),
    // -------------------------
    // READ
    // -------------------------
    fetchProjects: builder.query<Project[], void>({
      query: () => ({
        url: "projects",
        method: "get",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Project" as const, id })),
              "Project",
            ]
          : ["Project"],
    }),
    fetchQuartiers: builder.query<Quartier[], void>({
      query: () => ({
        url: "quartiers",
        method: "get",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Quartier" as const, id })),
              "Quartier",
            ]
          : ["Quartier"],
    }),
    fetchZones: builder.query<Zone[], void>({
      query: () => ({
        url: "zones",
        method: "get",
      }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Zone" as const, id })), "Zone"]
          : ["Zone"],
    }),
    fetchRisques: builder.query<Risque[], void>({
      query: () => ({
        url: "risques",
        method: "get",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Risque" as const, id })),
              "Risque",
            ]
          : ["Risque"],
    }),
    fetchSprints: builder.query<Sprint[], void>({
      query: () => ({
        url: "sprints",
        method: "get",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Sprint" as const, id })),
              "Sprint",
            ]
          : ["Sprint"],
    }),
    fetchDeploiement: builder.query<Deploiement[], void>({
      query: () => ({
        url: "deploiments",
        method: "get",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Deploiement" as const, id })),
              "Deploiement",
            ]
          : ["Deploiement"],
    }),
    fetchDeploimentHistory: builder.query<DeployHistory[], { id: string }>({
      query: (params) => ({
        url: "deploiments/" + params.id,
        method: "get",
      }),
      providesTags: (result, error, { id }) => [
        { type: "DeployHistory", id },
        "DeployHistory",
      ],
    }),
    fetchUserTasks: builder.query<Task[], void>({
      query: () => ({
        url: "sprints/tasks/user-tasks",
        method: "get",
      }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Task" as const, id })), "Task"]
          : ["Task"],
    }),
    fetchSprintTasks: builder.query<
      { success: boolean; sprint: any; tasks: Task[] },
      { sprintId: string }
    >({
      query: ({ sprintId }) => ({
        url: `sprints/${sprintId}/tasks`,
        method: "get",
      }),
      providesTags: (result, error, { sprintId }) =>
        result
          ? [
              ...result.tasks.map(({ id }) => ({ type: "Task" as const, id })),
              { type: "Task", id: `sprint-${sprintId}` },
              { type: "Sprint", id: sprintId },
            ]
          : [
              { type: "Task", id: `sprint-${sprintId}` },
              { type: "Sprint", id: sprintId },
            ],
    }),

    // -------------------------
    // PROJECT RISQUE ENDPOINTS
    // -------------------------
    getAllProjectsRisques: builder.query<ProjectRisque[], void>({
      query: () => ({
        url: "project-risques",
        method: "get",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "ProjectRisque" as const,
                id,
              })),
              "ProjectRisque",
            ]
          : ["ProjectRisque"],
    }),

    getProjectRisques: builder.query<ProjectRisque[], { projectId: string }>({
      query: ({ projectId }) => ({
        url: `project-risques/${projectId}`,
        method: "get",
      }),
      providesTags: (result, error, { projectId }) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "ProjectRisque" as const,
                id,
              })),
              { type: "ProjectRisque", id: projectId },
            ]
          : [{ type: "ProjectRisque", id: projectId }],
    }),

    assignRisquesToProject: builder.mutation<
      { success: boolean; message: string; data: any },
      { projectId: string; risqueIds: string[] }
    >({
      query: (body) => ({
        url: "project-risques",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProjectRisque", "Project", "Risque"],
    }),

    deleteProjectRisques: builder.mutation<
      { success: boolean; message: string; count: number },
      { ids: string[] }
    >({
      query: (body) => ({
        url: "project-risques",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["ProjectRisque", "Project", "Risque"],
    }),

    // -------------------------
    // UPDATE
    // -------------------------
    updateZone: builder.mutation<
      StandardReponse,
      { id: string; code_zone: string; nom: string; description?: string }
    >({
      query: (zone) => ({
        url: `zones/${zone.id}`,
        method: "put",
        body: zone,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Zone", id },
        "Zone",
      ],
    }),
    updateQuartier: builder.mutation<
      StandardReponse,
      {
        id: string;
        code_quartier: string;
        nom: string;
        description: string | null;
        zoneId: string;
      }
    >({
      query: (quartier) => ({
        url: `quartiers/${quartier.id}`,
        method: "put",
        body: quartier,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Quartier", id },
        "Quartier",
      ],
    }),
    updateProject: builder.mutation<StandardReponse, ProjectFormData>({
      query: (project) => ({
        url: `projects/${project.id}`,
        method: "put",
        body: project,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Project", id },
        "Project",
      ],
    }),
    updateRisque: builder.mutation<StandardReponse, RisqueFormData>({
      query: (risque) => ({
        url: `risques/${risque.id}`,
        method: "put",
        body: risque,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Risque", id },
        "Risque",
      ],
    }),
    updateSprint: builder.mutation<StandardReponse, SprintFormData>({
      query: (sprint) => ({
        url: `sprints/${sprint.id}`,
        method: "put",
        body: sprint,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Sprint", id },
        "Sprint",
        "Project",
      ],
    }),
    updateTask: builder.mutation<StandardReponse, TaskFormData>({
      query: (task) => ({
        url: `sprints/tasks/${task.id}`,
        method: "put",
        body: task,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Task",
        "Sprint",
      ],
    }),
    updateSprintStatus: builder.mutation<
      StandardReponse,
      { status: number; id: string }
    >({
      query: ({ id, status }) => ({
        url: `sprints/${id}/status`,
        method: "put",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Sprint", id },
        "Sprint",
        "Project",
        "Notification",
      ],
    }),
    updateTaskStatus: builder.mutation<
      StandardReponse,
      { status: number; id: string }
    >({
      query: (task) => ({
        url: `sprints/tasks/status/${task.id}`,
        method: "put",
        body: task,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Task",
        "Sprint",
      ],
    }),

    updateDeploiement: builder.mutation<StandardReponse, DeploiementFormData>({
      query: (deploiement) => ({
        url: `deploiments/${deploiement.id}`,
        method: "put",
        body: deploiement,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Deploiement", id },
        "Deploiement",
        "DeployHistory",
      ],
    }),

    // -------------------------
    // TYPENOEUD ENDPOINTS
    // -------------------------
    addTypeNoeud: builder.mutation<StandardReponse, TypeNoeudFormData>({
      query: (typeNoeud) => ({
        url: "type-noeuds",
        method: "post",
        body: typeNoeud,
      }),
      invalidatesTags: ["TypeNoeud"],
    }),

    fetchAllTypeNoeuds: builder.query<TypeNoeud[], void>({
      query: () => ({
        url: "type-noeuds",
        method: "get",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "TypeNoeud" as const, id })),
              "TypeNoeud",
            ]
          : ["TypeNoeud"],
    }),

    updateTypeNoeud: builder.mutation<StandardReponse, TypeNoeudFormData>({
      query: (typeNoeud) => ({
        url: `type-noeuds/${typeNoeud.id}`,
        method: "put",
        body: typeNoeud,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TypeNoeud", id },
        "TypeNoeud",
        "Noeud",
      ],
    }),

    deleteTypeNoeud: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `type-noeuds/${id}`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TypeNoeud", id },
        "TypeNoeud",
        "Noeud",
      ],
    }),

    // -------------------------
    // NOTIFICATIONS
    // -------------------------
    fetchNotifications: builder.query<Notification[], { userId: string }>({
      query: ({ userId }) => ({
        url: `notifications/user/${userId}`,
        method: "get",
      }),
      providesTags: (result, error, { userId }) => [
        { type: "Notification", id: userId },
        "Notification",
      ],
    }),

    fetchUnreadNotifications: builder.query<Notification[], { userId: string }>(
      {
        query: ({ userId }) => ({
          url: `notifications/user/${userId}/unread`,
          method: "get",
        }),
        providesTags: (result, error, { userId }) => [
          { type: "Notification", id: `${userId}-unread` },
          "Notification",
        ],
      }
    ),

    fetchProjectSprints: builder.query<
      ProjectSprintsResponse,
      { projectId: string }
    >({
      query: ({ projectId }) => ({
        url: `projects/${projectId}/sprints`,
        method: "get",
      }),
      providesTags: (result, error, { projectId }) =>
        result
          ? [
              ...result.sprints.map(({ id }) => ({
                type: "Sprint" as const,
                id,
              })),
              { type: "Sprint", id: projectId },
              { type: "Project", id: projectId },
            ]
          : [
              { type: "Sprint", id: projectId },
              { type: "Project", id: projectId },
            ],
    }),

    fetchUnreadCount: builder.query<
      { unreadCount: number },
      { userId: string }
    >({
      query: ({ userId }) => ({
        url: `notifications/user/${userId}/unread-count`,
        method: "get",
      }),
      providesTags: (result, error, { userId }) => [
        { type: "Notification", id: `${userId}-count` },
        "Notification",
      ],
    }),

    markNotificationAsRead: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `notifications/${id}/read`,
        method: "put",
      }),
      invalidatesTags: ["Notification"],
    }),

    markAllNotificationsAsRead: builder.mutation<
      StandardReponse,
      { userId: string }
    >({
      query: ({ userId }) => ({
        url: `notifications/user/${userId}/read-all`,
        method: "put",
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "Notification", id: userId },
        { type: "Notification", id: `${userId}-unread` },
        { type: "Notification", id: `${userId}-count` },
        "Notification",
      ],
    }),

    deleteNotification: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `notifications/${id}`,
        method: "delete",
      }),
      invalidatesTags: ["Notification"],
    }),

    deleteAllNotifications: builder.mutation<
      StandardReponse,
      { userId: string }
    >({
      query: ({ userId }) => ({
        url: `notifications/user/${userId}/all`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "Notification", id: userId },
        { type: "Notification", id: `${userId}-unread` },
        { type: "Notification", id: `${userId}-count` },
        "Notification",
      ],
    }),

    // -------------------------
    // INFRASTRUCTURE
    // -------------------------
    addInfrastructure: builder.mutation<
      StandardReponse,
      { noeudId: string; data: Omit<InfrastructureFormData, "id" | "noeudId"> }
    >({
      query: ({ noeudId, data }) => ({
        url: `infrastructure/${noeudId}`,
        method: "post",
        body: data,
      }),
      invalidatesTags: (result, error, { noeudId }) => [
        { type: "Infrastructure", id: noeudId },
        "Infrastructure",
        "Noeud",
      ],
    }),

    fetchInfrastructures: builder.query<Infrastructure[], void>({
      query: () => ({
        url: "infrastructure",
        method: "get",
      }),
      transformResponse: (response: {
        success: boolean;
        data: Infrastructure[];
      }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Infrastructure" as const,
                id,
              })),
              "Infrastructure",
            ]
          : ["Infrastructure"],
    }),

    fetchInfrastructureById: builder.query<Infrastructure, { id: string }>({
      query: ({ id }) => ({
        url: `infrastructure/${id}`,
        method: "get",
      }),
      providesTags: (result, error, { id }) => [
        { type: "Infrastructure", id },
        "Infrastructure",
      ],
    }),

    updateInfrastructure: builder.mutation<
      StandardReponse,
      InfrastructureFormData
    >({
      query: (infra) => ({
        url: `infrastructure/${infra.id}`,
        method: "put",
        body: infra,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Infrastructure", id },
        "Infrastructure",
        "Noeud",
      ],
    }),

    deleteInfrastructure: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `infrastructure/${id}`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Infrastructure", id },
        "Infrastructure",
        "Noeud",
      ],
    }),

    // -------------------------
    // DELETE
    // -------------------------
    deleteZone: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `zones/${id}`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Zone", id },
        "Zone",
      ],
    }),
    deleteQuartier: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `quartiers/${id}`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Quartier", id },
        "Quartier",
        "Zone",
      ],
    }),
    deleteProject: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `projects/${id}`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Project", id },
        "Project",
        "Noeud",
        "Sprint",
        "Risque",
        "ProjectRisque",
      ],
    }),
    deleteRisque: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `risques/${id}`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Risque", id },
        "Risque",
        "ProjectRisque",
      ],
    }),
    deleteSprint: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `sprints/${id}`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Sprint", id },
        "Sprint",
        "Project",
        "Task",
      ],
    }),
    deleteTask: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `sprints/tasks/${id}`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Task",
        "Sprint",
      ],
    }),
    deleteDeploiement: builder.mutation<StandardReponse, { id: string }>({
      query: ({ id }) => ({
        url: `deploiments/${id}`,
        method: "delete",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Deploiement", id },
        "Deploiement",
        "DeployHistory",
      ],
    }),
  }),
});

export const {
  // Create
  useAddZoneMutation,
  useAddQuartierMutation,
  useAddProjectMutation,
  useAddRisqueMutation,
  useAddTaskMutation,
  useAddSprintMutation,
  useAddDeploiementMutation,

  // Noeud endpoints
  useAddNoeudMutation,
  useFetchAllNoeudsQuery,
  useFetchNoeudsByProjectQuery,
  useUpdateNoeudMutation,
  useDeleteNoeudMutation,
  useFetchInfrastructuresByNoeudQuery,

  // Read
  useFetchProjectsQuery,
  useFetchQuartiersQuery,
  useFetchZonesQuery,
  useFetchRisquesQuery,
  useFetchSprintsQuery,
  useFetchDeploiementQuery,
  useFetchDeploimentHistoryQuery,
  useFetchUserTasksQuery,
  useFetchProjectSprintsQuery,
  useFetchSprintTasksQuery,

  // ProjectRisque endpoints
  useGetAllProjectsRisquesQuery,
  useGetProjectRisquesQuery,
  useAssignRisquesToProjectMutation,
  useDeleteProjectRisquesMutation,

  // Update
  useUpdateZoneMutation,
  useUpdateQuartierMutation,
  useUpdateProjectMutation,
  useUpdateRisqueMutation,
  useUpdateSprintMutation,
  useUpdateTaskStatusMutation,
  useUpdateSprintStatusMutation,
  useUpdateDeploiementMutation,

  // Delete
  useDeleteZoneMutation,
  useDeleteQuartierMutation,
  useDeleteProjectMutation,
  useDeleteRisqueMutation,
  useDeleteSprintMutation,
  useDeleteTaskMutation,
  useDeleteDeploiementMutation,
  useUpdateTaskMutation,

  // Notifications
  useFetchNotificationsQuery,
  useFetchUnreadNotificationsQuery,
  useFetchUnreadCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,

  // Infrastructure
  useAddInfrastructureMutation,
  useFetchInfrastructuresQuery,
  useFetchInfrastructureByIdQuery,
  useUpdateInfrastructureMutation,
  useDeleteInfrastructureMutation,

  // typenoeud
  useAddTypeNoeudMutation,
  useFetchAllTypeNoeudsQuery,
  useUpdateTypeNoeudMutation,
  useDeleteTypeNoeudMutation,

  // DevStack endpoints
  useAddDevStackMutation,
  useFetchAllDevStacksQuery,
  useUpdateDevStackMutation,
  useDeleteDevStackMutation,
  useAssignDevToStackMutation,
  useUnassignDevFromStackMutation,
  useFetchDevStacksByDeveloperQuery,
} = projectSlice;
