import { useAppDispatch, useAppSelector } from "../app/hooks";
import SidebarWithIcons from "../components/sidebar";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaTimes,
  FaClock,
} from "react-icons/fa";
import { GiSprint } from "react-icons/gi";
import { useState } from "react";
import SprintKanbanBoard from "../components/SprintKanBan";
import { toast } from "sonner";
import {
  useAddSprintMutation,
  useUpdateSprintMutation,
  useFetchSprintsQuery,
  useFetchProjectsQuery,
  useDeleteSprintMutation,
  useFetchSprintTasksQuery,
} from "../features/projects/projectsSlice";
import { useUsersQuery } from "../features/users/userSlice";
import {
  FaUser,
  FaEnvelope,
  FaBriefcase,
  FaCrown,
  FaCode,
} from "react-icons/fa";
import Select, { MultiValue } from "react-select";
import Navbar from "../components/navBar";

export interface SprintFormData {
  id: string;
  sprint_name: string;
  start_date: Date;
  start_time: string;
  end_date?: Date;
  end_time: string;
  projectId: string;
  developers: { userId: string; is_lead: boolean }[];
}
interface User {
  id: string;
  email: string;
  username: string;
  job_title: string;
  is_developper: boolean;
  is_admin: boolean;
}

export default function Sprints() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const sprints = useFetchSprintsQuery();
  const projects = useFetchProjectsQuery();
  const [addSprint] = useAddSprintMutation();
  const [updateSprint] = useUpdateSprintMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "update" | null>(null);
  const { data, refetch, isError } = useFetchSprintsQuery();
  const [keyword, setKeyword] = useState("");
  const [deleteSprint] = useDeleteSprintMutation();
  const usersQuery = useUsersQuery();
  // State for viewing user info
  const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // State for viewing sprint tasks
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [selectedSprintForTasks, setSelectedSprintForTasks] =
    useState<any>(null);

  // Fetch tasks for selected sprint
  const { data: sprintTasksData } = useFetchSprintTasksQuery(
    { sprintId: selectedSprintForTasks?.id || "" },
    { skip: !selectedSprintForTasks?.id }
  );

  const [formData, setFormData] = useState<SprintFormData>({
    id: "",
    sprint_name: "",
    start_date: new Date(),
    start_time: "09:00",
    end_date: undefined,
    end_time: "17:00",
    projectId: "",
    developers: [],
  });

  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState<string | null>(null);
  const [sprintNameToDelete, setSprintNameToDelete] = useState<string>("");

  // Helper function to get project name by ID
  const getProjectName = (projectId: string) => {
    const project = projects?.data?.find((p) => p.id === projectId);
    return project?.name || "Projet non trouvé";
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper to get task status badge
  const getTaskStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-400/30">
            To Do
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
            In Progress
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-full border border-green-400/30">
            Done
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-full border border-red-400/30">
            Non complété
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-500/20 text-gray-300 rounded-full border border-gray-400/30">
            Inconnu
          </span>
        );
    }
  };

  // Open tasks modal for a sprint
  const handleOpenTasksModal = (sprint: any) => {
    setSelectedSprintForTasks(sprint);
    setIsTasksModalOpen(true);
  };

  // Close tasks modal
  const handleCloseTasksModal = () => {
    setIsTasksModalOpen(false);
    setSelectedSprintForTasks(null);
  };

  // Open user info modal
  const handleViewUserInfo = (user: User) => {
    setSelectedUser(user);
    setIsUserInfoModalOpen(true);
  };

  // Close user info modal
  const handleCloseUserInfoModal = () => {
    setIsUserInfoModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenModal = (
    mode: "create" | "update",
    initialData?: SprintFormData
  ) => {
    setModalMode(mode);
    setIsModalOpen(true);

    if (initialData) {
      setFormData({
        ...initialData,
        start_time: initialData.start_time || "09:00",
        end_time: initialData.end_time || "17:00",
      });
    } else {
      setFormData({
        id: "",
        sprint_name: "",
        start_date: new Date(),
        start_time: "09:00",
        end_date: undefined,
        end_time: "17:00",
        projectId: "",
        developers: [],
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setFormData({
      id: "",
      sprint_name: "",
      start_date: new Date(),
      start_time: "09:00",
      end_date: undefined,
      end_time: "17:00",
      projectId: "",
      developers: [],
    });
  };

  // Open delete confirmation modal
  const openDeleteModal = (id: string, name: string) => {
    setSprintToDelete(id);
    setSprintNameToDelete(name);
    setIsDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSprintToDelete(null);
    setSprintNameToDelete("");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value ? new Date(value) : undefined,
    }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleUserChange = (
    selected: MultiValue<{ label: string; value: string }>
  ) => {
    const selectedUsers = selected.map((option) => ({
      userId: option.value,
      is_lead: false,
    }));
    setFormData((prevState) => ({
      ...prevState,
      developers: selectedUsers,
    }));
  };

  const handleLeadChange = (userId: string) => {
    setFormData((prevState) => ({
      ...prevState,
      developers: prevState.developers.map((user) =>
        user.userId === userId
          ? { ...user, is_lead: true }
          : { ...user, is_lead: false }
      ),
    }));
  };

  const handleDeleteSprint = async () => {
    if (!sprintToDelete) return;

    try {
      await deleteSprint({ id: sprintToDelete }).unwrap();
      refetch();
      closeDeleteModal();
      toast.success("Sprint supprimé avec succès!", {
        position: "top-center",
        duration: 5000,
      });
    } catch (error) {
      toast.error(
        "Erreur lors de la suppression du sprint (role access problem or network)",
        {
          position: "top-center",
          duration: 5000,
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Combine date and time for start_date
      const startDateWithTime = new Date(formData.start_date);
      const [startHours, startMinutes] = formData.start_time.split(':');
      startDateWithTime.setHours(parseInt(startHours), parseInt(startMinutes));

      // Combine date and time for end_date if it exists
      let endDateWithTime = undefined;
      if (formData.end_date) {
        endDateWithTime = new Date(formData.end_date);
        const [endHours, endMinutes] = formData.end_time.split(':');
        endDateWithTime.setHours(parseInt(endHours), parseInt(endMinutes));
      }

      const formDataWithDateTime = {
        ...formData,
        start_date: startDateWithTime,
        end_date: endDateWithTime,
      };

      let res;
      if (modalMode === "create") {
        res = await addSprint({
          projectId: formData.projectId,
          data: formDataWithDateTime,
        }).unwrap();
      } else if (modalMode === "update") {
        res = await updateSprint(formDataWithDateTime).unwrap();
      }
      refetch();
      handleCloseModal();
      toast.success(
        `${modalMode === "create" ? "Créé" : "Mis à jour"} avec succès!`,
        {
          position: "top-center",
          duration: 5000,
        }
      );
    } catch (error) {
      toast.error(
        "Une erreur est survenue peut etre vous n'etes pas l'access (project leader ou sprint leader) or just check you network",
        {
          position: "top-center",
          duration: 5000,
        }
      );
    }
  };

  const handleEditFromKanban = (sprint: any) => {
    // Extract time from existing date or use defaults
    const startDate = new Date(sprint.start_date);
    const startTime = startDate.toTimeString().slice(0, 5);
    
    let endTime = "17:00";
    if (sprint.end_date) {
      const endDate = new Date(sprint.end_date);
      endTime = endDate.toTimeString().slice(0, 5);
    }

    handleOpenModal("update", {
      id: sprint.id,
      sprint_name: sprint.sprint_name,
      start_date: new Date(sprint.start_date),
      start_time: startTime,
      end_date: sprint.end_date ? new Date(sprint.end_date) : undefined,
      end_time: endTime,
      projectId: sprint.projectId as string,
      developers: sprint.Sprint_developpers.map((developer: any) => ({
        userId: developer.user.id,
        is_lead: developer.is_lead,
      })),
    });
  };

  // Custom styles for react-select to match dark theme
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: "rgb(51 65 85 / 0.5)",
      borderColor: "rgb(71 85 105 / 0.5)",
      color: "white",
      "&:hover": {
        borderColor: "rgb(34 197 94)",
      },
      boxShadow: state.isFocused ? "0 0 0 2px rgb(34 197 94)" : "none",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "rgb(30 41 59)",
      border: "1px solid rgb(71 85 105 / 0.5)",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "rgb(34 197 94)"
        : state.isFocused
        ? "rgb(51 65 85)"
        : "transparent",
      color: "white",
      "&:hover": {
        backgroundColor: "rgb(51 65 85)",
      },
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: "rgb(34 197 94 / 0.2)",
      border: "1px solid rgb(34 197 94 / 0.3)",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: "rgb(134 239 172)",
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: "rgb(134 239 172)",
      "&:hover": {
        backgroundColor: "rgb(239 68 68)",
        color: "white",
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "white",
    }),
    input: (provided: any) => ({
      ...provided,
      color: "white",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "rgb(148 163 184)",
    }),
  };

  return (
    <div className="flex flex-row min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <SidebarWithIcons />
      <div className="flex-1 min-w-screen">
        <Navbar
          username={auth.username}
          role={auth.role}
          onSearchChange={setKeyword}
        />

        <div className="flex-1 p-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-600 to-green-500 rounded-xl shadow-lg">
                <GiSprint className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Sprints</h2>
            </div>

            <button
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all duration-300 transform hover:scale-105"
              onClick={() => handleOpenModal("create")}
            >
              <FaPlus className="h-4 w-4" />
              <span>Ajouter un sprint</span>
            </button>
          </div>

          {data && (
            <SprintKanbanBoard
              sprints={data}
              getProjectName={getProjectName}
              callback={() => {
                refetch();
              }}
              onEdit={handleEditFromKanban}
              onDelete={openDeleteModal}
              onViewTasks={handleOpenTasksModal}
              onViewUserInfo={handleViewUserInfo}
            />
          )}

          {/* Sprint Tasks Modal */}
          {isTasksModalOpen && selectedSprintForTasks && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleCloseTasksModal}
              ></div>
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-5xl bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl transform transition-all">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 rounded-t-2xl border-b border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg">
                        <FaClock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          Tâches du sprint
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                          {selectedSprintForTasks.sprint_name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseTasksModal}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-colors duration-200"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {sprintTasksData && sprintTasksData.tasks.length > 0 ? (
                      <div className="space-y-3">
                        {sprintTasksData.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-gradient-to-br from-slate-700/40 to-slate-700/20 rounded-xl border border-slate-600/50 p-4 hover:border-slate-500/70 transition-all duration-300"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-base font-semibold text-white">
                                    {task.designation}
                                  </h4>
                                  {getTaskStatusBadge(task.status)}
                                </div>

                                {task.description && (
                                  <p className="text-sm text-slate-400 mb-3">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                                  {task.developer && (
                                    <div className="flex items-center gap-1.5 bg-slate-700/40 px-2.5 py-1.5 rounded-md">
                                      <span className="text-blue-400">👤</span>
                                      <span title={task.developer.email}>
                                        {task.developer.email}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 bg-slate-700/40 px-2.5 py-1.5 rounded-md">
                                    <span className="text-green-400">📅</span>
                                    <span>
                                      Début: {formatDate(task.start_date)}
                                    </span>
                                  </div>
                                  {task.end_date && (
                                    <div className="flex items-center gap-1.5 bg-slate-700/40 px-2.5 py-1.5 rounded-md">
                                      <span className="text-red-400">📅</span>
                                      <span>
                                        Fin: {formatDate(task.end_date)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="bg-slate-700/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                          <FaClock className="h-12 w-12 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-400 mb-3">
                          Aucune tâche trouvée
                        </h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                          Ce sprint n'a pas encore de tâches assignées.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end p-6 border-t border-slate-700/50 bg-slate-800/30">
                    <button
                      onClick={handleCloseTasksModal}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Info Modal */}
          {isUserInfoModalOpen && selectedUser && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleCloseUserInfoModal}
              ></div>
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl transform transition-all">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 rounded-t-2xl border-b border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg">
                        <FaUser className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          Informations utilisateur
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseUserInfoModal}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-colors duration-200"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {/* Username */}
                      <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                        <FaUser className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-400">
                            Nom d'utilisateur
                          </p>
                          <p className="text-white font-medium">
                            {selectedUser.username}
                          </p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                        <FaEnvelope className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-400">Email</p>
                          <p className="text-white font-medium break-all">
                            {selectedUser.email}
                          </p>
                        </div>
                      </div>

                      {/* Job Title */}
                      <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                        <FaBriefcase className="h-5 w-5 text-purple-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-400">Poste</p>
                          <p className="text-white font-medium">
                            {selectedUser.job_title}
                          </p>
                        </div>
                      </div>

                      {/* Roles */}
                      <div className="space-y-2">
                        <p className="text-sm text-slate-400">Rôles</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.is_admin && (
                            <span className="inline-flex items-center px-3 py-1 text-sm bg-red-500/20 text-red-300 rounded-full border border-red-400/30">
                              <FaCrown className="h-3 w-3 mr-1" />
                              Administrateur
                            </span>
                          )}
                          {selectedUser.is_developper && (
                            <span className="inline-flex items-center px-3 py-1 text-sm bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                              <FaCode className="h-3 w-3 mr-1" />
                              Développeur
                            </span>
                          )}
                          {!selectedUser.is_admin &&
                            !selectedUser.is_developper && (
                              <span className="inline-flex items-center px-3 py-1 text-sm bg-gray-500/20 text-gray-300 rounded-full border border-gray-400/30">
                                Utilisateur
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end p-6 border-t border-slate-700/50 bg-slate-800/30">
                    <button
                      onClick={handleCloseUserInfoModal}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Delete Confirmation Modal */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={closeDeleteModal}
              ></div>

              {/* Modal Container */}
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl transform transition-all">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 rounded-t-2xl">
                    <h3 className="text-xl font-semibold text-white">
                      Confirmer la suppression
                    </h3>
                    <button
                      onClick={closeDeleteModal}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 pt-0 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
                      <FaExclamationTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Supprimer le sprint
                    </h3>
                    <p className="text-sm text-slate-300 mb-6">
                      Êtes-vous sûr de vouloir supprimer le sprint "
                      <span className="font-semibold text-white">
                        {sprintNameToDelete}
                      </span>
                      " ? Cette action est irréversible.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={closeDeleteModal}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleDeleteSprint}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create/Edit Sprint Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleCloseModal}
              ></div>

              {/* Modal Container */}
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-2xl bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl transform transition-all">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 rounded-t-2xl">
                    <h3 className="text-xl font-semibold text-white">
                      {modalMode === "create" ? "Ajouter" : "Modifier"} un
                      sprint
                    </h3>
                    <button
                      onClick={handleCloseModal}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 pt-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Sprint Name Input */}
                      <div>
                        <label
                          htmlFor="sprint_name"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Nom du sprint
                        </label>
                        <input
                          id="sprint_name"
                          name="sprint_name"
                          type="text"
                          maxLength={250}
                          value={formData.sprint_name}
                          onChange={handleChange}
                          placeholder="Nom du sprint"
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                        />
                        <p className="mt-1 text-sm text-slate-400">
                          Maximum 250 caractères
                        </p>
                      </div>

                      {/* Project Selection */}
                      <div>
                        <label
                          htmlFor="projectId"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Projet
                        </label>
                        <select
                          id="projectId"
                          name="projectId"
                          value={formData.projectId}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                        >
                          <option
                            value=""
                            className="bg-slate-700 text-slate-400"
                          >
                            Sélectionner un projet
                          </option>
                          {projects?.data?.map((project) => (
                            <option
                              key={project.id}
                              value={project.id}
                              className="bg-slate-700 text-white"
                            >
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date Inputs in Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Start Date Input */}
                        <div>
                          <label
                            htmlFor="start_date"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Date de début
                          </label>
                          <input
                            id="start_date"
                            name="start_date"
                            type="date"
                            value={formData.start_date ? formData.start_date.toISOString().split("T")[0] : ""}
                            onChange={handleDateChange}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>

                        {/* End Date Input */}
                        <div>
                          <label
                            htmlFor="end_date"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Date de fin
                          </label>
                          <input
                            id="end_date"
                            name="end_date"
                            type="date"
                            value={formData.end_date ? formData.end_date.toISOString().split("T")[0] : ""}
                            onChange={handleDateChange}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>
                      </div>

                      {/* Time Inputs in Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Start Time Input */}
                        <div>
                          <label
                            htmlFor="start_time"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Heure de début
                          </label>
                          <input
                            id="start_time"
                            name="start_time"
                            type="time"
                            value={formData.start_time}
                            onChange={handleTimeChange}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>

                        {/* End Time Input */}
                        <div>
                          <label
                            htmlFor="end_time"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Heure de fin
                          </label>
                          <input
                            id="end_time"
                            name="end_time"
                            type="time"
                            value={formData.end_time}
                            onChange={handleTimeChange}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>
                      </div>

                      {/* Developers Selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Développeurs assignés
                        </label>
                        <Select
                          options={
                            usersQuery?.data?.map((user) => ({
                              label: user.username,
                              value: user.id,
                            })) || []
                          }
                          value={formData.developers.map((user) => ({
                            label:
                              usersQuery?.data?.find(
                                (u) => u.id === user.userId
                              )?.username || "",
                            value: user.userId,
                          }))}
                          onChange={handleUserChange}
                          isMulti
                          styles={selectStyles}
                          placeholder="Sélectionner des développeurs..."
                          className="w-full"
                        />
                      </div>

                      {/* Lead Developer Selection */}
                      {formData.developers.length > 0 && (
                        <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <h4 className="text-sm font-medium text-slate-300 mb-3">
                            Sélectionner le lead développeur:
                          </h4>
                          <div className="space-y-2">
                            {formData.developers.map((user) => (
                              <label
                                key={user.userId}
                                className="flex items-center space-x-3 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name="is_lead"
                                  checked={user.is_lead}
                                  onChange={() => handleLeadChange(user.userId)}
                                  className="w-4 h-4 text-green-500 focus:ring-green-500 focus:ring-2"
                                />
                                <span className="text-slate-300">
                                  {
                                    usersQuery?.data?.find(
                                      (u) => u.id === user.userId
                                    )?.username
                                  }{" "}
                                  {user.is_lead && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-full border border-green-400/30">
                                      Lead
                                    </span>
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end space-x-4 pt-4">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        >
                          {modalMode === "create"
                            ? "Créer le sprint"
                            : "Mettre à jour le sprint"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}