import { useAppSelector } from "../app/hooks";
import SidebarWithIcons from "../components/sidebar";
import { FaSearch, FaPlus, FaExclamationTriangle } from "react-icons/fa";
import { GrDashboard } from "react-icons/gr";
import { useState } from "react";
import KanbanBoard from "../components/KanBanBoard";
import { toast } from "sonner";
import {
  useAddTaskMutation,
  useFetchSprintsQuery,
  useFetchUserTasksQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "../features/projects/projectsSlice";
import { useUsersQuery } from "../features/users/userSlice"; 
import Navbar from "../components/navBar";

export interface TaskFormData {
  id: string;
  designation: string;
  description: string | null;
  start_date: Date;
  start_time: string;
  end_date?: Date;
  end_time: string;
  developerId: string;
  sprintId: string;
}

export default function Home() {
  const auth = useAppSelector((state) => state.auth);
  const { data: tasks, isError, refetch } = useFetchUserTasksQuery();
  const { data: sprintsData } = useFetchSprintsQuery();
  const { data: usersData } = useUsersQuery(); // Fetch all users
  const [addTask] = useAddTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [keyword, setKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "update" | null>(null);

  // Form data state with TypeScript interface
  const [formData, setFormData] = useState<TaskFormData>({
    id: "",
    designation: "",
    description: "",
    start_date: new Date(),
    start_time: "09:00",
    end_date: undefined,
    end_time: "17:00",
    developerId: auth.id || "",
    sprintId: "",
  });

  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [taskNameToDelete, setTaskNameToDelete] = useState<string>("");

  const handleOpenModal = (
    mode: "create" | "update",
    initialData?: TaskFormData
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
        designation: "",
        description: "",
        start_date: new Date(),
        start_time: "09:00",
        end_date: undefined,
        end_time: "17:00",
        developerId: auth.id || "",
        sprintId: "",
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);

    setFormData({
      id: "",
      designation: "",
      description: "",
      start_date: new Date(),
      start_time: "09:00",
      end_date: undefined,
      end_time: "17:00",
      developerId: auth.id || "",
      sprintId: "",
    });
  };

  // Open delete confirmation modal
  const openDeleteModal = (id: string, name: string) => {
    setTaskToDelete(id);
    setTaskNameToDelete(name);
    setIsDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
    setTaskNameToDelete("");
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

  // Edit handler for Kanban board
  const handleEditFromKanban = (task: any) => {
    // Extract time from existing date or use defaults
    const startDate = new Date(task.start_date);
    const startTime = startDate.toTimeString().slice(0, 5);
    
    let endTime = "17:00";
    if (task.end_date) {
      const endDate = new Date(task.end_date);
      endTime = endDate.toTimeString().slice(0, 5);
    }

    handleOpenModal("update", {
      id: task.id,
      designation: task.designation,
      description: task.description,
      start_date: new Date(task.start_date),
      start_time: startTime,
      end_date: task.end_date ? new Date(task.end_date) : undefined,
      end_time: endTime,
      developerId: task.developerId || auth.id || "",
      sprintId: task.sprintId || "",
    });
  };

  // Handle form submission
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

      if (modalMode === "create") {
        await addTask(formDataWithDateTime).unwrap();
        toast.success("Tâche créée avec succès!", {
          position: "top-center",
          duration: 5000,
        });
      } else if (modalMode === "update") {
        await updateTask(formDataWithDateTime).unwrap();
        toast.success("Tâche mise à jour avec succès!", {
          position: "top-center",
          duration: 5000,
        });
      }
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error("Error submitting task:", error);
      toast.error("Une erreur est survenue peut etre vous n'avez pas l'acces ", {
        position: "top-center",
        duration: 5000,
      });
    }
  };

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask({ id: taskToDelete }).unwrap();
      refetch();
      closeDeleteModal();
      toast.success("Tâche supprimée avec succès!", {
        position: "top-center",
        duration: 5000,
      });
    } catch (error) {
      toast.error("Erreur lors de la suppression de la tâche peut etre vou", {
        position: "top-center",
        duration: 5000,
      });
    }
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
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg">
                <GrDashboard className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Board</h2>
            </div>

            <button
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
              onClick={() => handleOpenModal("create")}
            >
              <FaPlus className="h-4 w-4" />
              <span>Ajouter une tâche</span>
            </button>
          </div>

          {tasks && (
            <KanbanBoard
              tasks={tasks}
              callback={() => {
                refetch();
              }}
              onEdit={handleEditFromKanban}
              onDelete={openDeleteModal}
            />
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
                      Supprimer la tâche
                    </h3>
                    <p className="text-sm text-slate-300 mb-6">
                      Êtes-vous sûr de vouloir supprimer la tâche "
                      <span className="font-semibold text-white">
                        {taskNameToDelete}
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
                        onClick={handleDeleteTask}
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
                      {modalMode === "create" ? "Ajouter" : "Modifier"} une
                      tâche
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
                      {/* Designation Input */}
                      <div>
                        <label
                          htmlFor="designation"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Désignation
                        </label>
                        <input
                          id="designation"
                          name="designation"
                          type="text"
                          maxLength={250}
                          value={formData.designation}
                          onChange={handleChange}
                          placeholder="Désignation de la tâche"
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        />
                        <p className="mt-1 text-sm text-slate-400">
                          Maximum 250 caractères
                        </p>
                      </div>

                      {/* Developer and Sprint Selection in Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Developer Selection */}
                        <div>
                          <label
                            htmlFor="developerId"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Développeur
                          </label>
                          <select
                            id="developerId"
                            name="developerId"
                            value={formData.developerId}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          >
                            <option
                              value=""
                              className="bg-slate-700 text-slate-400"
                            >
                              Sélectionner un développeur
                            </option>
                            {usersData?.map((user) => (
                              <option
                                key={user.id}
                                value={user.id}
                                className="bg-slate-700 text-white"
                              >
                                {user.username} ({user.email})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="sprintId"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Sprint
                          </label>
                          <select
                            id="sprintId"
                            name="sprintId"
                            value={formData.sprintId}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          >
                            <option
                              value=""
                              className="bg-slate-700 text-slate-400"
                            >
                              Sélectionner un sprint
                            </option>
                            {sprintsData?.map((sprint) => (
                              <option
                                key={sprint.id}
                                value={sprint.id}
                                className="bg-slate-700 text-white"
                              >
                                {sprint.sprint_name}
                              </option>
                            ))}
                          </select>
                        </div>
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
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>

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
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description || ""}
                          onChange={handleChange}
                          placeholder="Description de la tâche (optionnel)"
                          rows={4}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                        />
                      </div>

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
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        >
                          {modalMode === "create"
                            ? "Créer la tâche"
                            : "Modifier la tâche"}
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