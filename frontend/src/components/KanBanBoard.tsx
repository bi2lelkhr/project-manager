import React, { useEffect, useReducer } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { AvatarImage } from "./Avatar";
import { parseAndFormatShortDate } from "../constantes";
import { FaAngleDoubleUp, FaTrash } from "react-icons/fa";
import { LuListTodo } from "react-icons/lu";
import { FaCheckDouble } from "react-icons/fa6";
import { useUpdateTaskStatusMutation } from "../features/projects/projectsSlice";
import { toast } from "sonner";


const scrollbarStyles = `
  .kanban-scrollable::-webkit-scrollbar {
    width: 6px;
  }
  .kanban-scrollable::-webkit-scrollbar-track {
    background: #1e293b;
    border-radius: 3px;
  }
  .kanban-scrollable::-webkit-scrollbar-thumb {
    background: #64748b;
    border-radius: 3px;
  }
  .kanban-scrollable::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;


if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
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

interface Sprint {
  id: string;
  sprint_name: string;
  start_date: string;
  end_date?: string | null;
  projectId?: string | null;
}

interface Task {
  id: string;
  designation: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  developer?: User | null;
  developerId?: string | null;
  sprint?: Sprint | null;
  sprintId?: string | null;
  status: number;
}

const TaskCard: React.FC<{
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (id: string, name: string) => void;
}> = ({ task, index, onEdit, onDelete }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-slate-700/50 p-3 mb-2 rounded shadow cursor-move"
        >
          
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="font-medium text-white">{task.designation}</span>
              {task.description && (
                <span className="text-slate-300"> : {task.description}</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="text-xs text-slate-300 hover:text-white p-1 hover:bg-slate-600/50 rounded transition-colors duration-200"
                title="Modifier"
              >
                ✏️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id, task.designation);
                }}
                className="text-xs text-red-400 hover:text-red-300 p-1 hover:bg-red-500/20 rounded transition-colors duration-200"
                title="Supprimer"
              >
                <FaTrash className="h-3 w-3" />
              </button>
            </div>
          </div>

      
          {task.status === 3 && (
            <div className="mt-2 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-300 font-medium">
             Terminé mais non complété
            </div>
          )}

        
          <div className="text-xs font-semibold bg-blue-500 mt-3 p-1 text-white rounded-md">
            {task.sprint?.sprint_name || "Migration SDCOM"}
          </div>

          {/* Footer row */}
          <div className="flex flex-row justify-between items-center mt-3">
            {/* Status Icon */}
            <div>
              {normalizeStatus(task.status) === 0 ? (
                <LuListTodo className="text-yellow-400" />
              ) : normalizeStatus(task.status) === 1 ? (
                <FaAngleDoubleUp className="text-green-400" />
              ) : (
                <FaCheckDouble className="text-blue-400" />
              )}
            </div>

            {/* Date + Avatar */}
            <div className="flex flex-row items-center">
              <div className="text-sm text-slate-300">
                {parseAndFormatShortDate(task.start_date)}
              </div>
              <span className="ms-3 inline-block">
                <AvatarImage
                  key={task.developer?.id}
                  isAdmin={true}
                  name={task.developer?.username ?? ""}
                  height="max-h-9"
                />
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

interface KanbanBoardProps {
  tasks: Task[];
  callback: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string, name: string) => void;
}

type TaskAction =
  | { type: "SET_TASKS"; tasks: Task[] }
  | { type: "UPDATE_TASK_STATUS"; id: string; status: number };

const taskReducer = (state: Task[], action: TaskAction): Task[] => {
  switch (action.type) {
    case "SET_TASKS":
      return action.tasks;
    case "UPDATE_TASK_STATUS":
      return state.map((task) =>
        task.id === action.id ? { ...task, status: action.status } : task
      );
    default:
      return state;
  }
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, callback, onEdit, onDelete }) => {
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [tasksState, dispatch] = useReducer(taskReducer, tasks);

  useEffect(() => {
    dispatch({ type: "SET_TASKS", tasks });
  }, [tasks]);

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

    const newTasks = Array.from(tasksState);
    const [movedTask] = newTasks.splice(
      newTasks.findIndex((task) => task.id === result.draggableId),
      1
    );
    newTasks.splice(destination.index, 0, {
      ...movedTask,
      status: destStatus,
    });

    dispatch({ type: "SET_TASKS", tasks: newTasks });

    try {
      await updateTaskStatus({
        id: movedTask.id,
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
                  className="flex-1 overflow-y-auto px-4 pb-4 min-h-0 kanban-scrollable"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#64748b #1e293b'
                  }}
                >
                  {tasksState
                    .filter(
                      (task) => normalizeStatus(task.status) === column.status
                    )
                    .map((task, index) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        index={index} 
                        onEdit={onEdit}
                        onDelete={onDelete}
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

export default KanbanBoard;