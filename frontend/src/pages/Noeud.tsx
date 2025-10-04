import { useState, useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import {
  FaEdit,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaNetworkWired,
  FaServer,
  FaLink,
  FaCode,
  FaInfoCircle,
} from "react-icons/fa";
import { MdDeveloperMode, MdDeviceHub } from "react-icons/md";
import {
  useAddNoeudMutation,
  useFetchAllNoeudsQuery,
  useFetchNoeudsByProjectQuery,
  useUpdateNoeudMutation,
  useDeleteNoeudMutation,
  useFetchProjectsQuery,
  useFetchAllDevStacksQuery,
  useFetchAllTypeNoeudsQuery,
  useFetchInfrastructuresQuery, // Add this import
} from "../features/projects/projectsSlice";
import { toast } from "sonner";
import SidebarWithIcons from "../components/sidebar";
import Navbar from "../components/navBar";
import type {
  Noeud,
  Project,
  DevStack,
  TypeNoeud,
} from "../models/ProjectSliceModels";

interface NoeudFormData {
  id?: string;
  designation: string;
  description?: string;
  repository_link?: string;
  typeNoeudId: string;
  devStackId: string;
  projectId: string;
  network?: string;
}

export default function Noeuds() {
  const auth = useAppSelector((state) => state.auth);
  const { data: allNoeuds, refetch } = useFetchAllNoeudsQuery();
  const projects = useFetchProjectsQuery();
  const { data: devStacks } = useFetchAllDevStacksQuery();
  const { data: typeNoeuds } = useFetchAllTypeNoeudsQuery();
  const { data: infrastructures } = useFetchInfrastructuresQuery(); // Add this hook

  const [keyword, setKeyword] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "update" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] =
    useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [addNoeud] = useAddNoeudMutation();
  const [updateNoeud] = useUpdateNoeudMutation();
  const [deleteNoeud] = useDeleteNoeudMutation();

  const [formData, setFormData] = useState<NoeudFormData>({
    id: "",
    designation: "",
    description: "",
    repository_link: "",
    typeNoeudId: "",
    devStackId: "",
    projectId: "",
    network: "",
  });

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNoeud, setSelectedNoeud] = useState<Noeud | null>(null);

  // Check user permissions
  const isAdmin = auth.role === "admin";

  // Add this function to check if Noeud is used in Infrastructure
  const isNoeudUsedInInfrastructure = (noeudId: string): boolean => {
    return infrastructures?.some(infra => infra.noeudId === noeudId) || false;
  };

  // Filter projects - only show projects where user is lead (or all projects if admin)
  const filteredProjects =
    projects?.data?.filter((p) => {
      if (isAdmin) {
        return true; // Admin can see all projects
      }
      // For non-admin users, only show projects where they are the lead
      return p.projectDevelopers?.some(
        (dev) => dev.userId === auth.id && dev.is_lead
      );
    }) || [];

  // Filter noeuds data based on keyword, project, and user permissions
  const filteredData =
    allNoeuds?.filter((noeud) => {
      const matchesKeyword =
        noeud.designation.toUpperCase().includes(keyword.toUpperCase()) ||
        (noeud.description &&
          noeud.description.toUpperCase().includes(keyword.toUpperCase())) ||
        (noeud.network &&
          noeud.network.toUpperCase().includes(keyword.toUpperCase()));

      const matchesProject =
        selectedProjectFilter === "all" ||
        noeud.projectId === selectedProjectFilter;

      // For non-admin users, only show noeuds from projects they lead
      const hasPermission =
        isAdmin || filteredProjects.some((p) => p.id === noeud.projectId);

      return matchesKeyword && matchesProject && hasPermission;
    }) || [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when keyword or filter changes
  const handleKeywordChange = (newKeyword: string) => {
    setKeyword(newKeyword);
    setCurrentPage(1);
  };

  const handleProjectFilterChange = (projectId: string) => {
    setSelectedProjectFilter(projectId);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleOpenModal = (mode: "create" | "update", initialData?: Noeud) => {
    setModalMode(mode);
    setIsModalOpen(true);

    if (initialData) {
      setFormData({
        id: initialData.id,
        designation: initialData.designation,
        description: initialData.description || "",
        repository_link: initialData.repository_link || "",
        typeNoeudId: initialData.typeNoeudId,
        devStackId: initialData.devStackId,
        projectId: initialData.projectId,
        network: initialData.network || "",
      });
    } else {
      setFormData({
        id: "",
        designation: "",
        description: "",
        repository_link: "",
        typeNoeudId: "",
        devStackId: "",
        projectId: selectedProjectFilter !== "all" ? selectedProjectFilter : "",
        network: "",
      });
    }
  };

  // Modify the handleOpenDeleteModal function to check if Noeud is used
  const handleOpenDeleteModal = (noeud: Noeud) => {
    // Check if the noeud is being used in any infrastructure
    if (isNoeudUsedInInfrastructure(noeud.id)) {
      toast.error("Ce nœud est utilisé par une ou plusieurs infrastructures et ne peut pas être supprimé", {
        position: "top-center",
        duration: 5000,
      });
      return;
    }
    
    setSelectedNoeud(noeud);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setFormData({
      id: "",
      designation: "",
      description: "",
      repository_link: "",
      typeNoeudId: "",
      devStackId: "",
      projectId: "",
      network: "",
    });
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedNoeud(null);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value === "" ? undefined : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (modalMode === "create") {
        await addNoeud(formData).unwrap();
      } else if (modalMode === "update") {
        await updateNoeud(formData).unwrap();
      }

      handleCloseModal();
      refetch();
      toast.success(
        `Nœud ${modalMode === "create" ? "créé" : "mis à jour"} avec succès!`,
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

  const handleDelete = async () => {
    if (!selectedNoeud) return;

    // Add an extra safety check before deletion
    if (isNoeudUsedInInfrastructure(selectedNoeud.id)) {
      toast.error("Impossible de supprimer : ce nœud est encore utilisé dans des infrastructures", {
        position: "top-center",
        duration: 5000,
      });
      handleCloseDeleteModal();
      return;
    }

    try {
      await deleteNoeud({ id: selectedNoeud.id }).unwrap();
      handleCloseDeleteModal();
      refetch();
      toast.success("Nœud supprimé avec succès!", {
        position: "top-center",
        duration: 5000,
      });

      // Adjust current page if necessary after deletion
      const newTotalItems = filteredData.length - 1;
      const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la suppression", {
        position: "top-center",
        duration: 5000,
      });
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects?.data?.find((p) => p.id === projectId);
    return project?.name || "Projet inconnu";
  };

  const getDevStackName = (devStackId: string) => {
    const devStack = devStacks?.find((ds) => ds.id === devStackId);
    return devStack
      ? `${devStack.framework} (${devStack.programming_language})`
      : "Stack inconnu";
  };

  const getNodeTypeName = (typeId: string) => {
    const nodeType = typeNoeuds?.find((nt) => nt.id === typeId);
    return nodeType?.designation || "Type inconnu";
  };

  return (
    <div className="flex flex-row min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <SidebarWithIcons />
      <div className="flex-1 min-w-screen">
        <Navbar
          username={auth.username}
          role={auth.role}
          onSearchChange={handleKeywordChange}
        />

        {/* Main Content Area */}
        <div className="flex-1 p-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl shadow-lg">
                <MdDeviceHub className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Gestion des Nœuds
              </h2>
            </div>

            {/* Only show create button if user has projects they lead (or is admin) */}
            {(isAdmin || filteredProjects.length > 0) && (
              <button
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
                onClick={() => handleOpenModal("create")}
              >
                <FaPlus className="h-4 w-4" />
                <span>Ajouter un nœud</span>
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
                    Vous ne pouvez voir que les nœuds des projets dont vous êtes
                    le chef de projet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Section */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-6 mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-slate-300 font-medium">
                Filtrer par projet:
              </label>
              <select
                value={selectedProjectFilter}
                onChange={(e) => handleProjectFilterChange(e.target.value)}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                <option value="all">Tous les projets</option>
                {filteredProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-6">
            <p className="text-slate-300 text-sm">
              Affichage de {startIndex + 1} à{" "}
              {Math.min(endIndex, filteredData.length)} sur{" "}
              {filteredData.length} nœuds
            </p>
          </div>

          {/* Table Container */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-b border-slate-600/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Désignation
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Projet
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Stack
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Réseau
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        {filteredProjects.length === 0 && !isAdmin ? (
                          <div className="flex flex-col items-center space-y-2">
                            <FaInfoCircle className="h-8 w-8 text-slate-500" />
                            <p>Aucun nœud trouvé</p>
                            <p className="text-sm text-slate-500">
                              Vous n'êtes pas chef de projet sur aucun projet
                            </p>
                          </div>
                        ) : (
                          "Aucun nœud trouvé"
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((noeud: Noeud) => {
                      const isUsed = isNoeudUsedInInfrastructure(noeud.id);
                      return (
                        <tr
                          key={noeud.id}
                          className="hover:bg-slate-700/30 transition-colors duration-200"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-lg mr-3">
                                <FaNetworkWired className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <span className="text-white font-medium">
                                  {noeud.designation}
                                </span>
                                {noeud.description && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    {noeud.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30">
                              {getNodeTypeName(noeud.typeNoeudId)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {getProjectName(noeud.projectId)}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            <div className="flex items-center">
                              <FaCode className="w-3 h-3 text-purple-400 mr-2" />
                              <span className="text-xs">
                                {getDevStackName(noeud.devStackId)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {noeud.network ? (
                              <div className="flex items-center">
                                <FaServer className="w-3 h-3 text-cyan-400 mr-2" />
                                <span className="text-slate-300 text-xs font-mono">
                                  {noeud.network}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs">
                                Non spécifié
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isUsed ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                                Utilisé
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30">
                                Disponible
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              {noeud.repository_link && (
                                <a
                                  href={noeud.repository_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg shadow-lg shadow-purple-500/30 transition-all duration-200 transform hover:scale-105"
                                  title="Voir le dépôt"
                                >
                                  <FaLink className="h-4 w-4" />
                                </a>
                              )}
                              {/* Only show edit button if user is admin or project lead of this noeud's project */}
                              {(isAdmin ||
                                filteredProjects.some(
                                  (p) => p.id === noeud.projectId
                                )) && (
                                <button
                                  className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-200 transform hover:scale-105"
                                  onClick={() => handleOpenModal("update", noeud)}
                                  title="Modifier"
                                >
                                  <FaEdit className="h-4 w-4" />
                                </button>
                              )}
                              {/* Only show delete button if user is admin or project lead of this noeud's project */}
                              {(isAdmin ||
                                filteredProjects.some(
                                  (p) => p.id === noeud.projectId
                                )) && (
                                <button
                                  className={`p-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 ${
                                    isUsed
                                      ? "bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed opacity-50"
                                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                  }`}
                                  onClick={() => handleOpenDeleteModal(noeud)}
                                  title={
                                    isUsed
                                      ? "Impossible de supprimer - nœud utilisé dans des infrastructures"
                                      : "Supprimer"
                                  }
                                  disabled={isUsed}
                                >
                                  <FaTrash className="h-4 w-4 text-white" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Row */}
          {totalPages > 1 && (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden mt-6">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-b border-slate-600/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-slate-300">
                    <span>
                      Page {currentPage} sur {totalPages} •{" "}
                      {filteredData.length} résultats
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        currentPage === 1
                          ? "text-slate-500 cursor-not-allowed"
                          : "text-slate-300 hover:text-white hover:bg-slate-600/30 rounded-lg"
                      }`}
                    >
                      <FaChevronLeft className="h-3 w-3 mr-1" />
                      Précédent
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1 mx-4">
                      {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1;
                        const isCurrentPage = page === currentPage;

                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 text-sm font-medium transition-all duration-200 rounded-lg ${
                                isCurrentPage
                                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30"
                                  : "text-slate-300 hover:text-white hover:bg-slate-600/30"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }

                        if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span
                              key={page}
                              className="px-2 py-1 text-slate-500 text-sm"
                            >
                              ...
                            </span>
                          );
                        }

                        return null;
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        currentPage === totalPages
                          ? "text-slate-500 cursor-not-allowed"
                          : "text-slate-300 hover:text-white hover:bg-slate-600/30 rounded-lg"
                      }`}
                    >
                      Suivant
                      <FaChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create/Update Modal */}
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
                        ? "Ajouter un nœud"
                        : "Modifier le nœud"}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="designation"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Désignation *
                          </label>
                          <input
                            id="designation"
                            name="designation"
                            type="text"
                            value={formData.designation}
                            onChange={handleChange}
                            placeholder="Nom du nœud"
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="network"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Réseau
                          </label>
                          <input
                            id="network"
                            name="network"
                            type="text"
                            value={formData.network || ""}
                            onChange={handleChange}
                            placeholder="192.168.1.100"
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
                          rows={3}
                          value={formData.description || ""}
                          onChange={handleChange}
                          placeholder="Description du nœud"
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="repository_link"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Lien du dépôt
                        </label>
                        <input
                          id="repository_link"
                          name="repository_link"
                          type="url"
                          value={formData.repository_link || ""}
                          onChange={handleChange}
                          placeholder="https://github.com/..."
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label
                            htmlFor="projectId"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Projet *
                          </label>
                          {filteredProjects.length > 0 ? (
                            <select
                              id="projectId"
                              name="projectId"
                              value={formData.projectId}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            >
                              <option value="">Sélectionner un projet</option>
                              {filteredProjects.map((project) => (
                                <option key={project.id} value={project.id}>
                                  {project.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-400 text-sm">
                              Aucun projet disponible - vous devez être chef de
                              projet pour créer un nœud
                            </div>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="typeNoeudId"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Type de nœud *
                          </label>
                          <select
                            id="typeNoeudId"
                            name="typeNoeudId"
                            value={formData.typeNoeudId}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          >
                            <option value="">Sélectionner un type</option>
                            {typeNoeuds?.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.designation}
                                {type.description && ` - ${type.description}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="devStackId"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Stack de développement *
                          </label>
                          <select
                            id="devStackId"
                            name="devStackId"
                            value={formData.devStackId}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          >
                            <option value="">Sélectionner un stack</option>
                            {devStacks?.map((stack) => (
                              <option key={stack.id} value={stack.id}>
                                {stack.framework} ({stack.programming_language})
                              </option>
                            ))}
                          </select>
                        </div>
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
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                          >
                            {modalMode === "create" ? "Créer" : "Modifier"}
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Delete Confirmation Modal */}
          {isDeleteModalOpen && selectedNoeud && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleCloseDeleteModal}
              ></div>

              {/* Modal Container */}
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-lg bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl transform transition-all">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 rounded-t-2xl">
                    <h3 className="text-xl font-semibold text-white">
                      Confirmer la suppression
                    </h3>
                    <button
                      onClick={handleCloseDeleteModal}
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
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 mb-4">
                        <FaTrash className="h-6 w-6 text-red-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        Supprimer le nœud
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">
                        Êtes-vous sûr de vouloir supprimer ce nœud ? Cette
                        action est irréversible et supprimera toutes les
                        infrastructures associées.
                      </p>
                      <div className="bg-slate-700/50 rounded-lg p-4 mb-6 text-left">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Nom:</span>
                            <span className="text-white">
                              {selectedNoeud.designation}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Type:</span>
                            <span className="text-white">
                              {getNodeTypeName(selectedNoeud.typeNoeudId)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Projet:</span>
                            <span className="text-white">
                              {getProjectName(selectedNoeud.projectId)}
                            </span>
                          </div>
                          {selectedNoeud.network && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Réseau:</span>
                              <span className="text-white font-mono">
                                {selectedNoeud.network}
                              </span>
                            </div>
                          )}
                          {selectedNoeud.description && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">
                                Description:
                              </span>
                              <span className="text-white">
                                {selectedNoeud.description}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end space-x-4">
                        <button
                          onClick={handleCloseDeleteModal}
                          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleDelete}
                          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        >
                          Supprimer
                        </button>
                      </div>
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