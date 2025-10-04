import { useAppDispatch, useAppSelector } from "../app/hooks";
import SidebarWithIcons from "../components/sidebar";
import { useUsersQuery } from "../features/users/userSlice";
import {
  FaEdit,
  FaPlus,
  FaExclamationTriangle,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaUsers,
  FaClock,
  FaUser,
  FaEnvelope,
  FaBriefcase,
  FaCrown,
  FaCode,
} from "react-icons/fa";
import { useState, useEffect, useMemo } from "react";
import {
  useAddProjectMutation,
  useFetchProjectsQuery,
  useFetchQuartiersQuery,
  useUpdateProjectMutation,
  useFetchRisquesQuery,
  useGetProjectRisquesQuery,
  useAssignRisquesToProjectMutation,
  useDeleteProjectRisquesMutation,
  useFetchProjectSprintsQuery,
} from "../features/projects/projectsSlice";
import { FaDiagramProject } from "react-icons/fa6";
import { GiSprint } from "react-icons/gi";
import { AvatarImage } from "../components/Avatar";
import { toast } from "sonner";
import { User } from "../models/UserSliceModels";
import Select, { MultiValue } from "react-select";
import Navbar from "../components/navBar";

export interface ProjectFormData {
  id: string;
  name?: string;
  description?: string;
  quartierId: string;
  developers: Developper[];
}

interface Developper {
  user: User;
  isLead: boolean;
  userId: string;
}

interface SelectOption {
  value: string;
  label: string;
  isLead?: boolean;
}

interface RisqueSelectOption {
  value: string;
  label: string;
}

const ITEMS_PER_PAGE = 5;

export default function Projects() {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedProjectForSprints, setSelectedProjectForSprints] =
    useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [addProject] = useAddProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [assignRisquesToProject] = useAssignRisquesToProjectMutation();
  const [deleteProjectRisques] = useDeleteProjectRisquesMutation();
  const auth = useAppSelector((state) => state.auth);
  const { data, refetch, isError } = useFetchProjectsQuery();
  const { data: risques } = useFetchRisquesQuery();
  const [keyword, setKeyword] = useState("");
  const [formData, setFormData] = useState<ProjectFormData>({
    id: "",
    name: "",
    description: "",
    quartierId: "",
    developers: [],
  });
  const [modalMode, setModalMode] = useState<"create" | "update" | null>(null);
  const quartiers = useFetchQuartiersQuery();
  const { data: users } = useUsersQuery();

  // Get project risks for selected project
  const { data: projectRisquesData } = useGetProjectRisquesQuery(
    { projectId: selectedProject?.id || "" },
    { skip: !selectedProject?.id }
  );

  // Get project sprints for selected project
  const { data: projectSprintsData } = useFetchProjectSprintsQuery(
    { projectId: selectedProjectForSprints?.id || "" },
    { skip: !selectedProjectForSprints?.id }
  );

  // Check user permissions
  const isAdmin = auth.role === "admin";
  const isProjectLead = (project: any) => {
    return project.projectDevelopers?.some(
      (dev: any) => dev.userId === auth.id && dev.is_lead
    );
  };
  const isInvolvedInProject = (project: any) => {
    return project.projectDevelopers?.some(
      (dev: any) => dev.userId === auth.id
    );
  };

  const canEditProject = (project: any) => {
    return isAdmin || isProjectLead(project);
  };

  const canManageRisks = (project: any) => {
    return isAdmin || isProjectLead(project);
  };

  const canCreateProject = isAdmin;

  // Filter and paginate projects
  const filteredProjects = useMemo(() => {
    if (!data) return [];

    // If user is admin, show all projects
    if (isAdmin) {
      return data.filter((e) =>
        e.name?.toUpperCase().includes(keyword.toUpperCase())
      );
    }

    // If user is not admin, only show projects they're involved in
    return data.filter(
      (e) =>
        isInvolvedInProject(e) &&
        e.name?.toUpperCase().includes(keyword.toUpperCase())
    );
  }, [data, keyword, isAdmin]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage]);

  // Reset to page 1 when search keyword changes
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  // Update selected risks when project risks data changes
  useEffect(() => {
    if (projectRisquesData && selectedProject) {
      const currentRiskIds = projectRisquesData.map((pr) => pr.risqueId);
      setSelectedRisks(currentRiskIds);
    }
  }, [projectRisquesData, selectedProject]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleOpenModal = (
    mode: "create" | "update",
    initialData?: ProjectFormData
  ) => {
    setModalMode(mode);
    setIsModalOpen(true);
    setFormData(
      initialData || {
        id: "",
        name: "",
        description: "",
        quartierId: "",
        developers: [],
      }
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setFormData({
      id: "",
      name: "",
      description: "",
      quartierId: "",
      developers: [],
    });
  };

  const handleOpenRiskModal = (project: any) => {
    setSelectedProject(project);
    setIsRiskModalOpen(true);
    setSelectedRisks([]);
  };

  const handleCloseRiskModal = () => {
    setIsRiskModalOpen(false);
    setSelectedProject(null);
    setSelectedRisks([]);
  };

  const handleOpenSprintModal = (project: any) => {
    setSelectedProjectForSprints(project);
    setIsSprintModalOpen(true);
  };

  const handleCloseSprintModal = () => {
    setIsSprintModalOpen(false);
    setSelectedProjectForSprints(null);
  };

  const handleOpenUserInfoModal = (user: any) => {
    setSelectedUser(user);
    setIsUserInfoModalOpen(true);
  };

  const handleCloseUserInfoModal = () => {
    setIsUserInfoModalOpen(false);
    setSelectedUser(null);
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-400/30">
            En attente
          </span>
        );
      case 1:
        return (
          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
            En cours
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-full border border-green-400/30">
            Terminé
          </span>
        );
      case 3:
        return (
          <span className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-full border border-red-400/30">
            Terminé mais pas completé
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-300 rounded-full border border-gray-400/30">
            Inconnu
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | any
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleDeveloperChange = (selectedOptions: MultiValue<SelectOption>) => {
    const newDevelopers = selectedOptions.map((option) => ({
      userId: option.value,
      isLead: option.isLead || false,
      user: users?.find((u) => u.id === option.value) as User,
    }));
    setFormData((prevState) => ({
      ...prevState,
      developers: newDevelopers,
    }));
  };

  const handleRisqueChange = (
    selectedOptions: MultiValue<RisqueSelectOption>
  ) => {
    const risqueIds = selectedOptions.map((option) => option.value);
    setSelectedRisks(risqueIds);
  };

  const handleLeadToggle = (selectedUserId: string) => {
    setFormData((prevState) => ({
      ...prevState,
      developers: prevState.developers.map((dev) => ({
        ...dev,
        isLead: dev.userId === selectedUserId,
      })),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.developers.some((dev) => dev.isLead)) {
      toast.error("Please select a lead developer", {
        position: "top-center",
        duration: 5000,
      });
      return;
    }
    try {
      let res;
      if (modalMode === "create") {
        res = await addProject(formData).unwrap();
      } else if (modalMode === "update") {
        res = await updateProject(formData).unwrap();
      }
      handleCloseModal();
      refetch();
      toast.success(
        `${modalMode === "create" ? "Créé" : "Mis à jour"} avec succès!`,
        {
          position: "top-center",
          duration: 5000,
        }
      );
    } catch (error) {
      toast.error("Une erreur est survenue", {
        position: "top-center",
        duration: 5000,
      });
    }
  };

  const handleRiskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProject) return;

    // Check if user has permission to modify risks
    if (!canManageRisks(selectedProject)) {
      toast.error("Vous n'avez pas la permission de modifier les risques", {
        position: "top-center",
        duration: 5000,
      });
      return;
    }

    try {
      const currentRiskIds = projectRisquesData?.map((pr) => pr.risqueId) || [];
      const risksToAdd = selectedRisks.filter(
        (id) => !currentRiskIds.includes(id)
      );
      const risksToRemove =
        projectRisquesData?.filter(
          (pr) => !selectedRisks.includes(pr.risqueId)
        ) || [];

      if (risksToAdd.length > 0) {
        await assignRisquesToProject({
          projectId: selectedProject.id,
          risqueIds: risksToAdd,
        }).unwrap();
      }

      if (risksToRemove.length > 0) {
        await deleteProjectRisques({
          ids: risksToRemove.map((pr) => pr.id),
        }).unwrap();
      }

      handleCloseRiskModal();
      refetch();
      toast.success("Risques mis à jour avec succès!", {
        position: "top-center",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error updating risks:", error);
      toast.error(
        "Une erreur est survenue lors de la mise à jour des risques",
        {
          position: "top-center",
          duration: 5000,
        }
      );
    }
  };

  const userOptions =
    users?.map((user) => ({
      value: user.id,
      label: user.username,
      isLead: false,
    })) || [];

  const risqueOptions: RisqueSelectOption[] =
    risques?.map((risque) => ({
      value: risque.id,
      label: `${risque.name} (Severity: ${risque.severity})`,
    })) || [];

  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: "rgb(51 65 85 / 0.5)",
      borderColor: "rgb(71 85 105 / 0.5)",
      color: "white",
      "&:hover": {
        borderColor: "rgb(59 130 246)",
      },
      boxShadow: state.isFocused ? "0 0 0 2px rgb(59 130 246)" : "none",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "rgb(30 41 59)",
      border: "1px solid rgb(71 85 105 / 0.5)",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "rgb(59 130 246)"
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
      backgroundColor: "rgb(239 68 68 / 0.2)",
      border: "1px solid rgb(239 68 68 / 0.3)",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: "rgb(254 202 202)",
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: "rgb(254 202 202)",
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

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
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
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg">
                <FaDiagramProject className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">
                  Liste des projets
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {filteredProjects.length} projet(s) trouvé(s)
                </p>
              </div>
            </div>
            {/* Show create button for admin and project leads */}
            {isAdmin && (
              <button
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
                onClick={() => handleOpenModal("create")}
              >
                <FaPlus className="h-4 w-4" />
                <span>Ajouter un projet</span>
              </button>
            )}
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-b border-slate-600/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Quartier
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Équipe
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Risques
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Gestion
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paginatedProjects.map((e) => (
                    <ProjectRow
                      key={e.id}
                      project={e}
                      onEdit={(projectData) =>
                        handleOpenModal("update", projectData)
                      }
                      onAssignRisk={() => handleOpenRiskModal(e)}
                      onViewSprints={() => handleOpenSprintModal(e)}
                      onViewUserInfo={handleOpenUserInfoModal}
                      canEditProject={canEditProject(e)}
                      canManageRisks={canManageRisks(e)}
                      isInvolvedInProject={isInvolvedInProject(e)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{" "}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredProjects.length
                    )}{" "}
                    sur {filteredProjects.length} projets
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevious}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        currentPage === 1
                          ? "text-slate-500 cursor-not-allowed"
                          : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                      }`}
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {getPageNumbers().map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white shadow-lg"
                              : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        currentPage === totalPages
                          ? "text-slate-500 cursor-not-allowed"
                          : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                      }`}
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Create/Edit Project Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleCloseModal}
              ></div>
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-3xl bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl transform transition-all">
                  <div className="flex items-center justify-between p-6 rounded-t-2xl">
                    <h3 className="text-xl font-semibold text-white">
                      {modalMode === "create"
                        ? "Ajouter un projet"
                        : "Modifier un projet"}
                    </h3>
                    <button
                      onClick={handleCloseModal}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-colors duration-200"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 pt-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Nom du projet
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name || ""}
                          onChange={handleChange}
                          placeholder="Entrez le nom du projet"
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        />
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
                          placeholder="Entrez une description (optionnel)"
                          rows={4}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="quartierId"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Quartier
                        </label>
                        <select
                          id="quartierId"
                          name="quartierId"
                          value={formData.quartierId}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        >
                          <option
                            value=""
                            className="bg-slate-700 text-slate-400"
                          >
                            Sélectionnez un quartier...
                          </option>
                          {quartiers?.data?.map((quartier) => (
                            <option
                              key={quartier.id}
                              value={quartier.id}
                              className="bg-slate-700 text-white"
                            >
                              {quartier.nom}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Développeurs
                        </label>
                        <Select
                          isMulti={true}
                          options={userOptions}
                          value={formData.developers.map((dev) => ({
                            value: dev.userId,
                            label: dev.user.username,
                            isLead: dev.isLead,
                          }))}
                          onChange={handleDeveloperChange}
                          placeholder="Sélectionner des développeurs..."
                          styles={selectStyles}
                          className="basic-multi-select"
                          classNamePrefix="select"
                        />
                        {formData.developers.length > 0 && (
                          <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                            <h4 className="text-sm font-medium text-slate-300 mb-3">
                              Sélectionner le développeur principal :
                            </h4>
                            <div className="space-y-2">
                              {formData.developers.map((dev) => (
                                <label
                                  key={dev.userId}
                                  className="flex items-center space-x-3 cursor-pointer hover:bg-slate-600/30 p-2 rounded-lg transition-colors duration-200"
                                >
                                  <input
                                    type="radio"
                                    name="leadDeveloper"
                                    checked={dev.isLead}
                                    onChange={() =>
                                      handleLeadToggle(dev.userId)
                                    }
                                    className="w-4 h-4 text-blue-500 focus:ring-blue-500 focus:ring-2"
                                  />
                                  <span className="text-slate-300">
                                    {dev.user.username}{" "}
                                    {dev.isLead && (
                                      <span className="ml-2 px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                                        Chef d'équipe
                                      </span>
                                    )}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
                            ? "Créer le projet"
                            : "Mettre à jour le projet"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Risk Management Modal */}
          {isRiskModalOpen && selectedProject && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleCloseRiskModal}
              ></div>
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-2xl bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl transform transition-all">
                  <div className="flex items-center justify-between p-6 rounded-t-2xl border-b border-slate-700/50">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {canManageRisks(selectedProject)
                          ? "Gestion des risques"
                          : "Visualisation des risques"}
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">
                        Projet: {selectedProject.name}
                      </p>
                    </div>
                    <button
                      onClick={handleCloseRiskModal}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-colors duration-200"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handleRiskSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          <div className="flex items-center space-x-2">
                            <FaExclamationTriangle className="h-4 w-4 text-red-400" />
                            <span>
                              {canManageRisks(selectedProject)
                                ? "Sélectionner les risques"
                                : "Risques assignés"}
                            </span>
                          </div>
                        </label>
                        <Select
                          isMulti={true}
                          options={risqueOptions}
                          value={risqueOptions.filter((option) =>
                            selectedRisks.includes(option.value)
                          )}
                          onChange={handleRisqueChange}
                          placeholder="Sélectionner des risques..."
                          styles={selectStyles}
                          className="basic-multi-select"
                          classNamePrefix="select"
                          isDisabled={!canManageRisks(selectedProject)}
                        />
                        {!canManageRisks(selectedProject) && (
                          <div className="mt-2 p-2 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                            <p className="text-sm text-yellow-300">
                              Mode visualisation seulement
                            </p>
                          </div>
                        )}
                        {selectedRisks.length > 0 && (
                          <div className="mt-3 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                            <p className="text-sm text-red-300">
                              {selectedRisks.length} risque(s) sélectionné(s)
                            </p>
                          </div>
                        )}
                      </div>
                      {projectRisquesData && projectRisquesData.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-3">
                            Risques actuellement assignés:
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {projectRisquesData.map((pr) => (
                              <div
                                key={pr.id}
                                className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg"
                              >
                                <span className="text-slate-300 text-sm">
                                  {pr.risque?.name} (Severity:{" "}
                                  {pr.risque?.severity})
                                </span>
                                <span className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-full border border-red-400/30">
                                  Assigné
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-700/50">
                        <button
                          type="button"
                          onClick={handleCloseRiskModal}
                          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        >
                          Fermer
                        </button>
                        {/* Only show update button for users with manage permissions */}
                        {canManageRisks(selectedProject) && (
                          <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                          >
                            Mettre à jour les risques
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sprint Management Modal */}
          {isSprintModalOpen && selectedProjectForSprints && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleCloseSprintModal}
              ></div>
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-7xl bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl transform transition-all">
                  <div className="flex items-center justify-between p-6 rounded-t-2xl border-b border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-green-600 to-green-500 rounded-lg">
                        <GiSprint className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          Sprints du projet
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                          {selectedProjectForSprints.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseSprintModal}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-colors duration-200"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {projectSprintsData &&
                    projectSprintsData.sprints.length > 0 ? (
                      <div className="space-y-6">
                        {projectSprintsData.sprints.map((sprint) => (
                          <div
                            key={sprint.id}
                            className="bg-gradient-to-br from-slate-700/40 to-slate-700/20 rounded-xl border-2 border-slate-600/50 p-5 hover:border-slate-500/70 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-600/30">
                              <h4 className="text-lg font-semibold text-white">
                                {sprint.sprint_name}
                              </h4>
                              {getStatusBadge(sprint.status)}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              <div className="p-3 bg-slate-800/40 rounded-lg">
                                <div className="flex items-center space-x-2 text-slate-300 mb-2">
                                  <FaCalendarAlt className="h-4 w-4 text-green-400" />
                                  <span className="text-sm font-medium">
                                    Dates
                                  </span>
                                </div>
                                <div className="space-y-1 ml-6">
                                  <p className="text-sm text-slate-400">
                                    <span className="text-slate-300">
                                      Début:
                                    </span>{" "}
                                    {formatDate(sprint.start_date)}
                                  </p>
                                  {sprint.end_date && (
                                    <p className="text-sm text-slate-400">
                                      <span className="text-slate-300">
                                        Fin:
                                      </span>{" "}
                                      {formatDate(sprint.end_date)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="p-3 bg-slate-800/40 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <FaUsers className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm font-medium text-slate-200">
                                      Équipe
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">
                                    {sprint.Sprint_developpers?.length || 0}{" "}
                                    dev(s)
                                  </span>
                                </div>

                                {sprint.Sprint_developpers &&
                                sprint.Sprint_developpers.length > 0 ? (
                                  <div className="max-h-32 overflow-y-auto pr-1 space-y-1.5">
                                    {sprint.Sprint_developpers.map((dev) => (
                                      <div
                                        key={dev.id}
                                        className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                                          dev.is_lead
                                            ? "bg-yellow-500/15 border border-yellow-400/30 hover:bg-yellow-500/20"
                                            : "bg-slate-700/50 border border-slate-600/30 hover:bg-slate-700/70"
                                        }`}
                                      >
                                        <span
                                          className="text-white text-xs truncate flex-1 pr-2"
                                          title={dev.user.email}
                                        >
                                          {dev.user.email}
                                        </span>
                                        {dev.is_lead && (
                                          <span className="px-1.5 py-0.5 bg-yellow-500/30 text-yellow-300 text-xs rounded border border-yellow-400/40 flex-shrink-0">
                                            Lead
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-2">
                                    <p className="text-xs text-slate-500">
                                      Aucun développeur assigné
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="p-3 bg-slate-800/40 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <FaClock className="h-4 w-4 text-purple-400" />
                                    <span className="text-sm font-medium text-slate-200">
                                      Tâches
                                    </span>
                                  </div>
                                  <span className="text-lg font-bold text-purple-300">
                                    {sprint.tasks?.length || 0}
                                  </span>
                                </div>

                                {sprint.tasks && sprint.tasks.length > 0 ? (
                                  <div className="max-h-32 overflow-y-auto pr-1 space-y-1.5">
                                    {sprint.tasks.map((task) => (
                                      <div
                                        key={task.id}
                                        className="p-2 bg-slate-700/50 border border-slate-600/30 rounded-md hover:bg-slate-700/70 transition-colors"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <p
                                              className="text-xs text-white font-medium truncate"
                                              title={task.designation}
                                            >
                                              {task.designation}
                                            </p>
                                            {task.description && (
                                              <p
                                                className="text-xs text-slate-400 truncate mt-0.5"
                                                title={task.description}
                                              >
                                                {task.description}
                                              </p>
                                            )}
                                            {task.developer && (
                                              <p
                                                className="text-xs text-blue-300 truncate mt-1"
                                                title={task.developer.email}
                                              >
                                                👤 {task.developer.email}
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex-shrink-0">
                                            {task.status === 0 ? (
                                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded border border-yellow-400/30">
                                                To Do
                                              </span>
                                            ) : task.status === 1 ? (
                                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">
                                                In Progress
                                              </span>
                                            ) : task.status === 2 ? (
                                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-green-500/20 text-green-300 rounded border border-green-400/30">
                                                Done
                                              </span>
                                            ) : task.status === 3 ? (
                                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-red-500/20 text-red-300 rounded border border-red-400/30">
                                                Not Completed
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-500/20 text-gray-300 rounded border border-gray-400/30">
                                                Unknown
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-2">
                                    <p className="text-xs text-slate-500">
                                      Aucune tâche assignée
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="bg-slate-700/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                          <GiSprint className="h-12 w-12 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-400 mb-3">
                          Aucun sprint trouvé
                        </h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                          Ce projet n'a pas encore de sprints assignés.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end p-6 border-t border-slate-700/50 bg-slate-800/30">
                    <button
                      onClick={handleCloseSprintModal}
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
                  <div className="flex items-center justify-between p-6 rounded-t-2xl border-b border-slate-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg">
                        <FaUser className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          Informations développeur
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

                  <div className="p-6">
                    <div className="space-y-4">
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

                      <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                        <FaEnvelope className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-400">Email</p>
                          <p className="text-white font-medium break-all">
                            {selectedUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                        <FaBriefcase className="h-5 w-5 text-purple-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-400">Poste</p>
                          <p className="text-white font-medium">
                            {selectedUser.job_title || "Non spécifié"}
                          </p>
                        </div>
                      </div>

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
        </div>
      </div>
    </div>
  );
}

function ProjectRow({
  project,
  onEdit,
  onAssignRisk,
  onViewSprints,
  onViewUserInfo,
  canEditProject,
  canManageRisks,
  isInvolvedInProject,
}: {
  project: any;
  onEdit: (projectData: any) => void;
  onAssignRisk: () => void;
  onViewSprints: () => void;
  onViewUserInfo: (user: any) => void;
  canEditProject: boolean;
  canManageRisks: boolean;
  isInvolvedInProject: boolean;
}) {
  const { data: projectRisques } = useGetProjectRisquesQuery(
    { projectId: project.id },
    { skip: !project.id }
  );

  return (
    <tr className="hover:bg-slate-700/30 transition-colors duration-200">
      <td className="px-6 py-4 text-white font-medium">
        {project.name || "N/A"}
      </td>
      <td className="px-6 py-4 text-slate-300">
        <div className="max-w-xs truncate">{project.description || "N/A"}</div>
      </td>
      <td className="px-6 py-4 text-slate-300">{project.quartier.nom}</td>
      <td className="px-6 py-4">
        <div className="flex -space-x-2">
          {project.projectDevelopers.map((dev: any) => (
            <button
              key={dev.id}
              onClick={() => onViewUserInfo(dev.user)}
              className="transition-transform duration-200 hover:scale-110 focus:outline-none"
              title={`Voir les informations de ${dev.user.username}`}
            >
              <AvatarImage isAdmin={dev.is_lead} name={dev.user.username} />
            </button>
          ))}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <FaExclamationTriangle className="h-4 w-4 text-red-400" />
          <span className="text-sm text-slate-300">
            {projectRisques?.length || 0} risque(s)
          </span>
        </div>
        {projectRisques && projectRisques.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {projectRisques.slice(0, 2).map((pr) => (
              <span
                key={pr.id}
                className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-full border border-red-400/30"
              >
                {pr.risque?.name}
              </span>
            ))}
            {projectRisques.length > 2 && (
              <span className="px-2 py-1 text-xs bg-slate-600/50 text-slate-400 rounded-full">
                +{projectRisques.length - 2}
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-center space-x-2">
          {/* View Sprints - Available for all involved users */}
          <button
            className="p-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg shadow-lg shadow-green-500/30 transition-all duration-200 transform hover:scale-105"
            onClick={onViewSprints}
            title="Voir les sprints"
          >
            <GiSprint className="h-4 w-4" />
          </button>

          {/* Manage Risks - Available for admin and project leads */}
          {canManageRisks ? (
            <button
              className="p-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-lg shadow-red-500/30 transition-all duration-200 transform hover:scale-105"
              onClick={onAssignRisk}
              title="Gérer les risques"
            >
              <FaExclamationTriangle className="h-4 w-4" />
            </button>
          ) : (
            // View Risks Only - For regular involved users
            isInvolvedInProject && (
              <button
                className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg shadow-lg shadow-gray-500/30 transition-all duration-200 transform hover:scale-105"
                onClick={onAssignRisk}
                title="Voir les risques (lecture seule)"
              >
                <FaExclamationTriangle className="h-4 w-4" />
              </button>
            )
          )}
        </div>
      </td>
      {/* Edit Project - For admin and project leads */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-center">
          {canEditProject && (
            <button
              className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-200 transform hover:scale-105"
              onClick={() => {
                onEdit({
                  id: project.id,
                  name: project.name || "",
                  description: project.description || "",
                  quartierId: project.quartierId,
                  developers: project.projectDevelopers.map((d: any) => ({
                    userId: d.userId,
                    isLead: d.is_lead,
                    user: d.user,
                  })),
                });
              }}
              title="Modifier le projet"
            >
              <FaEdit className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
