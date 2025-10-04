import React, { useEffect, useReducer } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { AvatarImage } from "./Avatar";
import { parseAndFormatShortDate } from "../constantes";
import { FaAngleDoubleUp, FaTrash, FaEye } from "react-icons/fa";
import { LuListTodo } from "react-icons/lu";
import { FaCheckDouble } from "react-icons/fa6";
import { useUpdateSprintStatusMutation } from "../features/projects/projectsSlice";
import { toast } from "sonner";


const scrollbarStyles = `
  .sprint-kanban-scrollable::-webkit-scrollbar {
    width: 6px;
  }
  .sprint-kanban-scrollable::-webkit-scrollbar-track {
    background: #1e293b;
    border-radius: 3px;
  }
  .sprint-kanban-scrollable::-webkit-scrollbar-thumb {
    background: #64748b;
    border-radius: 3px;
  }
  .sprint-kanban-scrollable::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

// Inject styles into document head
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = scrollbarStyles;
  document.head.appendChild(styleSheet);
}

const statusMap: Record<number, string> = {
  0: "To Do",
  1: "In Progress",
  2: "Done",
};

const normalizeStatus = (status: number): number => {
  if (status === 3) return 1;
  return status;
};

interface User {
  id: string;
  email: string;
  username: string;
  job_title: string;
  is_developper: boolean;
  is_admin: boolean;
}

interface SprintDeveloper {
  id: string;
  userId: string;
  sprintId: string;
  is_lead: boolean;
  user: User;
}

export interface Sprint {
  id: string;
  sprint_name: string;
  start_date: string;
  end_date?: string | null;
  projectId?: string | null;
  status: number;
  Sprint_developpers: SprintDeveloper[];
}

const SprintCard: React.FC<{
  sprint: Sprint;
  index: number;
  getProjectName: (projectId: string) => string;
  onEdit: (sprint: Sprint) => void;
  onDelete: (id: string, name: string) => void;
  onViewTasks: (sprint: Sprint) => void;
  onViewUserInfo: (user: User) => void;
}> = ({
  sprint,
  index,
  getProjectName,
  onEdit,
  onDelete,
  onViewTasks,
  onViewUserInfo,
}) => {
  return (
    <Draggable draggableId={sprint.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-slate-700/50 p-3 mb-2 rounded shadow cursor-move"
        >
          {/* Title + Edit/Delete buttons */}
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-white">{sprint.sprint_name}</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTasks(sprint);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-500/20 rounded transition-colors duration-200"
                title="Voir les tâches"
              >
                <FaEye className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(sprint);
                }}
                className="text-xs text-slate-300 hover:text-white p-1 hover:bg-slate-600/50 rounded transition-colors duration-200"
                title="Modifier"
              >
                ✏️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(sprint.id, sprint.sprint_name);
                }}
                className="text-xs text-red-400 hover:text-red-300 p-1 hover:bg-red-500/20 rounded transition-colors duration-200"
                title="Supprimer"
              >
                <FaTrash className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Status 3 warning note */}
          {sprint.status === 3 && (
            <div className="mt-2 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-300 font-medium">
              ⚠️ Terminé mais non complété
            </div>
          )}

          {/* Project name */}
          <div className="text-xs font-semibold bg-blue-500 mt-3 p-1 text-white rounded-md">
            {getProjectName(sprint.projectId as string)}
          </div>

          {/* Footer row */}
          <div className="flex flex-row justify-between items-center mt-3">
            {/* Status Icon */}
            <div>
              {normalizeStatus(sprint.status) === 0 ? (
                <LuListTodo className="text-yellow-400" />
              ) : normalizeStatus(sprint.status) === 1 ? (
                <FaAngleDoubleUp className="text-green-400" />
              ) : (
                <FaCheckDouble className="text-blue-400" />
              )}
            </div>

            {/* Date + Avatar */}
            <div className="flex flex-row items-center">
              <div className="text-sm text-slate-300 flex flex-col">
                <span>{parseAndFormatShortDate(sprint.start_date)}</span>
                {sprint.end_date && (
                  <span className="text-xs text-slate-400">
                    → {parseAndFormatShortDate(sprint.end_date)}
                  </span>
                )}
              </div>
              <span className="ms-3 inline-block">
                <div className="flex -space-x-1 flex-wrap">
                  {sprint.Sprint_developpers.map((dev) => (
                    <button
                      key={dev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewUserInfo(dev.user);
                      }}
                      className="hover:z-10 hover:scale-110 transition-transform duration-200"
                      title={`${dev.user.username} - ${dev.user.job_title}`}
                    >
                      <AvatarImage
                        isAdmin={dev.is_lead}
                        name={dev.user.username}
                        height="max-h-8"
                      />
                    </button>
                  ))}
                </div>
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

interface SprintKanbanBoardProps {
  sprints: Sprint[];
  getProjectName: (projectId: string) => string;
  callback: () => void;
  onEdit: (sprint: Sprint) => void;
  onDelete: (id: string, name: string) => void;
  onViewTasks: (sprint: Sprint) => void;
  onViewUserInfo: (user: User) => void;
}

type SprintAction =
  | { type: "SET_SPRINTS"; sprints: Sprint[] }
  | { type: "UPDATE_SPRINT_STATUS"; id: string; status: number };

const sprintReducer = (state: Sprint[], action: SprintAction): Sprint[] => {
  switch (action.type) {
    case "SET_SPRINTS":
      return action.sprints;
    case "UPDATE_SPRINT_STATUS":
      return state.map((sprint) =>
        sprint.id === action.id ? { ...sprint, status: action.status } : sprint
      );
    default:
      return state;
  }
};

const SprintKanbanBoard: React.FC<SprintKanbanBoardProps> = ({
  sprints,
  getProjectName,
  callback,
  onEdit,
  onDelete,
  onViewTasks,
  onViewUserInfo,
}) => {
  const [updateSprintStatus] = useUpdateSprintStatusMutation();
  const [sprintsState, dispatch] = useReducer(sprintReducer, sprints);

  useEffect(() => {
    dispatch({ type: "SET_SPRINTS", sprints });
  }, [sprints]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    if (
      !destination ||
      (source.droppableId === destination.droppableId &&
        source.index === destination.index)
    ) {
      return;
    }

    const sourceStatus = parseInt(source.droppableId);
    const destStatus = parseInt(destination.droppableId);

    const newSprints = Array.from(sprintsState);
    const [movedSprint] = newSprints.splice(
      newSprints.findIndex((sprint) => sprint.id === result.draggableId),
      1
    );
    newSprints.splice(destination.index, 0, {
      ...movedSprint,
      status: destStatus,
    });

    dispatch({ type: "SET_SPRINTS", sprints: newSprints });

    try {
      await updateSprintStatus({
        id: movedSprint.id,
        status: destStatus,
      }).unwrap();

      callback();

      toast.success(`Mis à jour avec succès!`, {
        position: "top-center",
        duration: 5000,
      });
    } catch (error) {
      toast.error("Échec de la mise à jour", {
        position: "top-center",
        duration: 5000,
      });

      // Revert on error
      dispatch({ type: "SET_SPRINTS", sprints });
    }
  };

  const columns = Object.entries(statusMap).map(([status, name]) => ({
    status: parseInt(status),
    name,
  }));

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 px-4 h-[calc(100vh-200px)]">
        {columns.map((column) => (
          <div
            key={column.status}
            className="w-96 bg-slate-800/50 rounded-lg flex flex-col"
          >
            <h2 className="text-lg font-semibold p-3 bg-slate-700 text-white mb-3 rounded-t-lg flex-shrink-0">
              {column.name}
            </h2>
            <Droppable droppableId={String(column.status)}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex-1 overflow-y-auto px-4 pb-4 min-h-0 sprint-kanban-scrollable"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#64748b #1e293b",
                  }}
                >
                  {sprintsState
                    .filter(
                      (sprint) =>
                        normalizeStatus(sprint.status) === column.status
                    )
                    .map((sprint, index) => (
                      <SprintCard
                        key={sprint.id}
                        sprint={sprint}
                        index={index}
                        getProjectName={getProjectName}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onViewTasks={onViewTasks}
                        onViewUserInfo={onViewUserInfo}
                      />
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default SprintKanbanBoard;
