import { useAppDispatch, useAppSelector } from "../app/hooks";
import SidebarWithIcons from "../components/sidebar";
import {
  Button,
  Label,
  Select,
  Table,
  Textarea,
  TextInput,
} from "flowbite-react";
import {
  FaEdit,
  FaSearch,
  FaHistory,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useAddDeploiementMutation,
  useFetchDeploiementQuery,
  useUpdateDeploiementMutation,
  useFetchDeploimentHistoryQuery,
  useFetchProjectsQuery,
} from "../features/projects/projectsSlice";
import { AvatarImage } from "../components/Avatar";
import { parseAndFormatDate } from "../constantes";
import {
  BookmarkIcon,
  TagIcon,
  LinkIcon,
  CodeBracketIcon,
  PowerIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { GrDeploy } from "react-icons/gr";
// At the top of Deploiments.tsx
import { DeployHistory } from "../models/ProjectSliceModels";
import { skipToken } from "@reduxjs/toolkit/query";
import Navbar from "../components/navBar";

// Remove the local DeployHistory interface
export interface DeploiementFormData {
  id: string;
  projectId: string;
  type: string;
  link: string;
  repository: string;
  is_alive: string; // Changed from boolean to string
}

export default function Deploiments() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const { data, refetch } = useFetchDeploiementQuery();
  const { data: project } = useFetchProjectsQuery();
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<
    string | null
  >(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Check user permissions
  const isAdmin = auth.role === "admin";

  // Filter projects - only show projects where user is lead (or all projects if admin)
  const filteredProjects =
    project?.filter((p) => {
      if (isAdmin) {
        return true; // Admin can see all projects
      }
      // For non-admin users, only show projects where they are the lead
      return p.projectDevelopers?.some(
        (dev) => dev.userId === auth.id && dev.is_lead
      );
    }) || [];

  // Filter deployments data based on user permissions
  const filteredDeployments =
    data?.filter((deployment) => {
      // For non-admin users, only show deployments from projects they lead
      return (
        isAdmin || filteredProjects.some((p) => p.id === deployment.project.id)
      );
    }) || [];

  // Debug: log when selectedDeploymentId changes
  useEffect(() => {
    console.log("selectedDeploymentId changed:", selectedDeploymentId);
  }, [selectedDeploymentId]);

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useFetchDeploimentHistoryQuery(
    selectedDeploymentId ? { id: selectedDeploymentId } : skipToken,
    { skip: !selectedDeploymentId }
  );

  // Debug: log history data and loading state
  useEffect(() => {
    console.log("History data:", historyData);
    console.log("Is history loading:", isHistoryLoading);
    console.log("History error:", historyError);
  }, [historyData, isHistoryLoading, historyError]);

  const [addDeploiement] = useAddDeploiementMutation();
  const [updateDeploiement] = useUpdateDeploiementMutation();

  const [keyword, setKeyword] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "update" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDeploiement, setSelectedDeploiement] =
    useState<DeploiementFormData | null>(null);

  const [history, setHistory] = useState<DeployHistory[]>([]);

  const [formData, setFormData] = useState<DeploiementFormData>({
    id: "",
    projectId: "",
    type: "",
    link: "",
    repository: "",
    is_alive: "false", // Changed to string
  });

  // Pagination calculations - use filteredDeployments instead of data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDeployments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(
    (filteredDeployments.length || 0) / itemsPerPage
  );

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handleOpenModal = (
    mode: "create" | "update",
    initialData?: DeploiementFormData
  ) => {
    setModalMode(mode);
    setIsModalOpen(true);

    if (mode === "create" && filteredProjects.length > 0) {
      // Auto-select the first project when creating
      setFormData({
        id: "",
        projectId: filteredProjects[0].id, // Set to first project's ID
        type: "",
        link: "",
        repository: "",
        is_alive: "false",
      });
    } else if (initialData) {
      // Use provided data for update mode
      setFormData(initialData);
    } else {
      // Fallback for create mode if no projects exist
      setFormData({
        id: "",
        projectId: "",
        type: "",
        link: "",
        repository: "",
        is_alive: "false",
      });
    }
  };

  const handleOpenDetailModal = async (deploiement: DeploiementFormData) => {
    console.log("Opening detail modal for deployment:", deploiement.id);
    setSelectedDeploymentId(deploiement.id);
    setSelectedDeploiement(deploiement);
  };

  // Update history when historyData changes
  useEffect(() => {
    if (historyData && selectedDeploymentId) {
      console.log("Setting history data:", historyData);
      setHistory(historyData);

      // Open the modal only after we have the history data
      if (!isDetailModalOpen) {
        setIsDetailModalOpen(true);
      }
    }
  }, [historyData, selectedDeploymentId, isDetailModalOpen]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setFormData({
      id: "",
      projectId: "",
      type: "",
      link: "",
      repository: "",
      is_alive: "false",
    });
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDeploiement(null);
    setSelectedDeploymentId(null);
    setHistory([]);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (modalMode === "create") {
        await addDeploiement(formData).unwrap();
      } else if (modalMode === "update") {
        await updateDeploiement(formData).unwrap();
      }

      handleCloseModal();
      refetch();
      toast.success(
        `${
          modalMode === "create"
            ? "Déploiement ajouté"
            : "Déploiement mis à jour"
        } avec succès!`,
        {
          position: "top-center",
          duration: 5000,
        }
      );
    } catch (error) {
      toast.error(
        "Erreur : problème réseau ou vous n'êtes pas le chef du projet sélectionné.",
        {
          position: "top-center",
          duration: 5000,
        }
      );
    }
  };

  // Pagination functions
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
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

        {/* Main Content Area */}
        <div className="flex-1 p-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-lg">
                <GrDeploy className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Liste des Déploiements
              </h2>
            </div>

            {/* Only show create button if user has projects they lead (or is admin) */}
            {(isAdmin || filteredProjects.length > 0) && (
              <button
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-105"
                onClick={() => handleOpenModal("create")}
              >
                <FaPlus className="h-4 w-4" />
                <span>Ajouter un Déploiement</span>
              </button>
            )}
          </div>

          {/* Information Banner for non-admin users */}
          {!isAdmin && (
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <FaInfoCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="text-blue-300 font-medium text-sm">
                    Information d'accès
                  </h3>
                  <p className="text-blue-200 text-sm mt-1">
                    Vous ne pouvez voir ou creer que les déploiements des
                    projets dont vous êtes le chef de projet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-b border-slate-600/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Projet
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Repository
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        {filteredProjects.length === 0 && !isAdmin ? (
                          <div className="flex flex-col items-center space-y-2">
                            <FaInfoCircle className="h-8 w-8 text-slate-500" />
                            <p>Aucun déploiement trouvé</p>
                            <p className="text-sm text-slate-500">
                              Vous n'êtes pas chef de projet sur aucun projet
                            </p>
                          </div>
                        ) : (
                          "Aucun déploiement trouvé"
                        )}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((e) => (
                      <tr
                        key={e.id}
                        className="hover:bg-slate-700/30 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 text-white font-medium">
                          {e.project.name}
                        </td>
                        <td className="px-6 py-4 text-slate-300">{e.type}</td>
                        <td className="px-6 py-4 text-slate-300">
                          {e.repository}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              e.is_alive === "true"
                                ? "bg-green-500/20 text-green-300 border border-green-400/30"
                                : "bg-red-500/20 text-red-300 border border-red-400/30"
                            }`}
                          >
                            {e.is_alive === "true" ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {/* Only show edit button if user is admin or project lead */}
                            {(isAdmin ||
                              filteredProjects.some(
                                (p) => p.id === e.project.id
                              )) && (
                              <button
                                className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-200 transform hover:scale-105"
                                onClick={() =>
                                  handleOpenModal("update", {
                                    id: e.id,
                                    projectId: e.project.id,
                                    type: e.type,
                                    link: e.link || "",
                                    repository: e.repository || "",
                                    is_alive: e.is_alive || "false",
                                  })
                                }
                              >
                                <FaEdit className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-105"
                              onClick={() => {
                                handleOpenDetailModal({
                                  id: e.id,
                                  projectId: e.project.id,
                                  type: e.type,
                                  link: e.link || "",
                                  repository: e.repository || "",
                                  is_alive: e.is_alive || "false",
                                });
                              }}
                            >
                              <FaHistory className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredDeployments.length > itemsPerPage && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50">
                <div className="text-sm text-slate-400">
                  Affichage de {indexOfFirstItem + 1} à{" "}
                  {Math.min(indexOfLastItem, filteredDeployments.length)} sur{" "}
                  {filteredDeployments.length} déploiements
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === 1
                        ? "text-slate-600 cursor-not-allowed"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }`}
                  >
                    <FaChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => goToPage(pageNumber)}
                          className={`min-w-[2rem] px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                            currentPage === pageNumber
                              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                              : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === totalPages
                        ? "text-slate-600 cursor-not-allowed"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }`}
                  >
                    <FaChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Rest of your modal code remains the same */}
          {/* Custom Create/Update Modal */}
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
                      {modalMode === "create"
                        ? "Ajouter un Déploiement"
                        : "Modifier un Déploiement"}
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
                      <div>
                        <label
                          htmlFor="projectId"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Nom du Projet
                        </label>
                        {filteredProjects.length > 0 ? (
                          <select
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                            value={formData.projectId}
                            name="projectId"
                            id="projectId"
                            onChange={handleChange}
                          >
                            {filteredProjects.map((e) => (
                              <option
                                key={e.id}
                                value={e.id}
                                className="bg-slate-700 text-white"
                              >
                                {e.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-400">
                            Aucun projet disponible - vous devez être chef de
                            projet pour créer un déploiement
                          </div>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="type"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Type
                        </label>
                        <input
                          id="type"
                          name="type"
                          type="text"
                          value={formData.type}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="link"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Lien
                        </label>
                        <input
                          id="link"
                          name="link"
                          type="text"
                          value={formData.link}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="repository"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Repository
                        </label>
                        <input
                          id="repository"
                          name="repository"
                          type="text"
                          value={formData.repository}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="is_alive"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Status
                        </label>
                        <select
                          id="is_alive"
                          name="is_alive"
                          value={formData.is_alive}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        >
                          <option
                            value="true"
                            className="bg-slate-700 text-white"
                          >
                            Actif
                          </option>
                          <option
                            value="false"
                            className="bg-slate-700 text-white"
                          >
                            Inactif
                          </option>
                        </select>
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
                        {filteredProjects.length > 0 && (
                          <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                          >
                            {modalMode === "create" ? "Créer" : "Mettre à jour"}
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Detail Modal */}
          {isDetailModalOpen && selectedDeploiement && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleCloseDetailModal}
              ></div>

              {/* Modal Container */}
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-4xl bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl transform transition-all">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 rounded-t-2xl">
                    <h3 className="text-xl font-semibold text-white">
                      Détails du Déploiement
                    </h3>
                    <button
                      onClick={handleCloseDetailModal}
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
                    <div className="space-y-4">
                      <p className="flex items-center text-slate-300">
                        <BookmarkIcon className="w-5 h-5 mr-3 text-slate-400" />
                        <span className="font-semibold w-48">
                          Nom du Projet :
                        </span>
                        <span className="text-white">
                          {project?.find(
                            (p) => p.id === selectedDeploiement.projectId
                          )?.name || selectedDeploiement.projectId}
                        </span>
                      </p>
                      <p className="flex items-center text-slate-300">
                        <TagIcon className="w-5 h-5 mr-3 text-slate-400" />
                        <span className="font-semibold w-48">Type :</span>
                        <span className="text-white">
                          {selectedDeploiement.type}
                        </span>
                      </p>
                      <p className="flex items-center text-slate-300">
                        <LinkIcon className="w-5 h-5 mr-3 text-slate-400" />
                        <span className="font-semibold w-48">Lien :</span>
                        <a
                          href={selectedDeploiement.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline truncate"
                        >
                          {selectedDeploiement.link}
                        </a>
                      </p>
                      <p className="flex items-center text-slate-300">
                        <CodeBracketIcon className="w-5 h-5 mr-3 text-slate-400" />
                        <span className="font-semibold w-48">Repository :</span>
                        <a
                          href={selectedDeploiement.repository}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline truncate"
                        >
                          {selectedDeploiement.repository}
                        </a>
                      </p>
                      <p className="flex items-center text-slate-300">
                        <PowerIcon className="w-5 h-5 mr-3 text-slate-400" />
                        <span className="font-semibold w-48">Status :</span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedDeploiement.is_alive === "true"
                              ? "bg-green-500/20 text-green-300 border border-green-400/30"
                              : "bg-red-500/20 text-red-300 border border-red-400/30"
                          }`}
                        >
                          {selectedDeploiement.is_alive === "true"
                            ? "Actif"
                            : "Inactif"}
                        </span>
                      </p>
                    </div>
                    <div>
                      {isHistoryLoading ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                      ) : historyError ? (
                        <div className="text-red-400 text-center py-4">
                          Erreur lors du chargement de l'historique
                        </div>
                      ) : (
                        <HistoriqueDeploiement history={history} />
                      )}
                    </div>
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

const HistoriqueDeploiement: React.FC<{ history: DeployHistory[] }> = ({
  history,
}) => {
  return (
    <div className="flex flex-col min-w-screen border-t-2 border-slate-600/50 mt-3 pt-3 max-h-56 overflow-y-auto">
      <div className="flex flex-row items-center mb-4">
        <FaHistory size={20} className="text-slate-400" />
        <h3 className="text-lg text-white ml-2 font-semibold">
          Historique des déploiements
        </h3>
      </div>
      <div className="flex flex-col gap-3">
        {history.length === 0 ? (
          <div className="text-slate-400 text-center py-4">
            Aucun historique disponible
          </div>
        ) : (
          history.map((e) => (
            <div key={e.id}>
              <div className="flex flex-row items-start bg-slate-700/50 p-3 rounded-lg shadow border border-slate-600/50">
                <div className="mt-2">
                  <AvatarImage
                    isAdmin={true}
                    name={e.author ?? ""}
                    height="max-h-9"
                  />
                </div>
                <div className="ms-5 flex-1">
                  <h2 className="text-md text-white font-semibold">
                    {e.author}
                  </h2>

                  <h3 className="text-md text-slate-300">{e.commit}</h3>
                  <h5 className="text-sm text-purple-400">
                    {parseAndFormatDate(e.date_dep)}
                  </h5>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
