import { useAppDispatch, useAppSelector } from "../app/hooks";
import SidebarWithIcons from "../components/sidebar";
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useAddInfrastructureMutation,
  useFetchInfrastructuresQuery,
  useUpdateInfrastructureMutation,
  useDeleteInfrastructureMutation,
  useFetchAllNoeudsQuery,
  useFetchProjectsQuery,
} from "../features/projects/projectsSlice";
import { HiServer } from "react-icons/hi";
import Navbar from "../components/navBar";

export interface InfrastructureFormData {
  id?: string;
  noeudId?: string;
  network: string;
  port: number;
  in_out: string;
  protocol: string;
}

export interface Infrastructure {
  id: string;
  noeudId: string;
  noeudDesignation?: string; // Added for display
  network: string;
  port: number;
  in_out: string;
  protocol: string;
}

export default function Infrastructure() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  // Fetch infrastructures and noeuds
  const { data: infrastructures, refetch } = useFetchInfrastructuresQuery();
  const { data: noeuds } = useFetchAllNoeudsQuery();
  const { data: projects } = useFetchProjectsQuery();

  const [addInfrastructure] = useAddInfrastructureMutation();
  const [updateInfrastructure] = useUpdateInfrastructureMutation();
  const [deleteInfrastructure] = useDeleteInfrastructureMutation();

  const [keyword, setKeyword] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "update" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInfrastructure, setSelectedInfrastructure] =
    useState<Infrastructure | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [formData, setFormData] = useState<InfrastructureFormData>({
    id: "",
    noeudId: "",
    network: "",
    port: 80,
    in_out: "IN",
    protocol: "TCP",
  });

  // Check user permissions
  const isAdmin = auth.role === "admin";

  // Filter projects - only show projects where user is lead (or all projects if admin)
  const filteredProjects =
    projects?.filter((p) => {
      if (isAdmin) {
        return true; // Admin can see all projects
      }
      // For non-admin users, only show projects where they are the lead
      return p.projectDevelopers?.some(
        (dev) => dev.userId === auth.id && dev.is_lead
      );
    }) || [];

  // Filter noeuds - only show noeuds from projects user leads (or all if admin)
  const filteredNoeuds =
    noeuds?.filter((noeud) => {
      if (isAdmin) {
        return true; // Admin can see all noeuds
      }
      // For non-admin users, only show noeuds from projects they lead
      return filteredProjects.some((project) => project.id === noeud.projectId);
    }) || [];

  // Filter infrastructures - only show infrastructures from noeuds user has access to
  const filteredInfrastructures =
    infrastructures?.filter((infra) => {
      if (isAdmin) {
        return true; // Admin can see all infrastructures
      }
      // For non-admin users, only show infrastructures from noeuds they have access to
      return filteredNoeuds.some((noeud) => noeud.id === infra.noeudId);
    }) || [];

  // Enhance infrastructures with node designations for display
  const enhancedInfrastructures = filteredInfrastructures?.map((infra) => {
    const noeud = noeuds?.find((n) => n.id === infra.noeudId);
    return {
      ...infra,
      noeudDesignation: noeud?.designation || "Noeud inconnu",
    };
  });

  const searchedInfrastructures = enhancedInfrastructures?.filter(
    (infra) =>
      infra.network.toLowerCase().includes(keyword.toLowerCase()) ||
      infra.protocol.toLowerCase().includes(keyword.toLowerCase()) ||
      infra.in_out.toLowerCase().includes(keyword.toLowerCase()) ||
      infra.port.toString().includes(keyword) ||
      infra.noeudDesignation?.toLowerCase().includes(keyword.toLowerCase())
  );

  // Pagination calculations
  const totalItems = searchedInfrastructures?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = searchedInfrastructures?.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleOpenModal = (
    mode: "create" | "update",
    initialData?: Infrastructure
  ) => {
    setModalMode(mode);
    setIsModalOpen(true);

    if (mode === "create") {
      setFormData({
        id: "",
        noeudId: "",
        network: "",
        port: 80,
        in_out: "IN",
        protocol: "TCP",
      });
    } else if (initialData) {
      setFormData({
        id: initialData.id,
        noeudId: initialData.noeudId,
        network: initialData.network,
        port: initialData.port,
        in_out: initialData.in_out,
        protocol: initialData.protocol,
      });
    }
  };

  const handleOpenDeleteModal = (infrastructure: Infrastructure) => {
    setSelectedInfrastructure(infrastructure);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setFormData({
      id: "",
      noeudId: "",
      network: "",
      port: 80,
      in_out: "IN",
      protocol: "TCP",
    });
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedInfrastructure(null);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: name === "port" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (modalMode === "create") {
        if (!formData.noeudId) {
          toast.error("Veuillez sélectionner un noeud", {
            position: "top-center",
            duration: 5000,
          });
          return;
        }

        const { noeudId, ...dataWithoutId } = formData;
        await addInfrastructure({
          noeudId: noeudId!,
          data: dataWithoutId,
        }).unwrap();
      } else if (modalMode === "update") {
        await updateInfrastructure(
          formData as InfrastructureFormData & { id: string }
        ).unwrap();
      }

      handleCloseModal();
      refetch();
      toast.success(
        `Infrastructure ${
          modalMode === "create" ? "ajoutée" : "mise à jour"
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

  const handleDelete = async () => {
    if (!selectedInfrastructure) return;

    try {
      await deleteInfrastructure({ id: selectedInfrastructure.id }).unwrap();
      handleCloseDeleteModal();
      refetch();
      toast.success("Infrastructure supprimée avec succès!", {
        position: "top-center",
        duration: 5000,
      });

      // Adjust current page if necessary after deletion
      const newTotalItems = totalItems - 1;
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

  const getInOutBadge = (inOut: string) => {
    return inOut === "IN"
      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
      : "bg-orange-500/20 text-orange-300 border border-orange-400/30";
  };

  const getProtocolBadge = (protocol: string) => {
    const colors = {
      TCP: "bg-green-500/20 text-green-300 border border-green-400/30",
      UDP: "bg-purple-500/20 text-purple-300 border border-purple-400/30",
      HTTP: "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30",
      HTTPS: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30",
    };
    return (
      colors[protocol as keyof typeof colors] ||
      "bg-gray-500/20 text-gray-300 border border-gray-400/30"
    );
  };

  // Get node designation for display
  const getNoeudDesignation = (noeudId: string) => {
    const noeud = noeuds?.find((n) => n.id === noeudId);
    return noeud?.designation || "Noeud inconnu";
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
              <div className="p-3 bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-xl shadow-lg">
                <HiServer className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Infrastructure Réseau
              </h2>
            </div>

            {/* Only show create button if user has noeuds they can access (or is admin) */}
            {(isAdmin || filteredNoeuds.length > 0) && (
              <button
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-105"
                onClick={() => handleOpenModal("create")}
              >
                <FaPlus className="h-4 w-4" />
                <span>Ajouter Infrastructure</span>
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
                    Vous ne pouvez voir que les matrices de flux des projets
                    dont vous êtes le chef de projet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total</p>
                  <p className="text-white text-2xl font-bold">
                    {filteredInfrastructures?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 rounded-xl">
                  <HiServer className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">TCP</p>
                  <p className="text-white text-2xl font-bold">
                    {filteredInfrastructures?.filter(
                      (i) => i.protocol === "TCP"
                    ).length || 0}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl">
                  <span className="text-green-400 font-bold text-sm">TCP</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Entrant</p>
                  <p className="text-white text-2xl font-bold">
                    {filteredInfrastructures?.filter((i) => i.in_out === "IN")
                      .length || 0}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl">
                  <span className="text-blue-400 font-bold text-sm">IN</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Sortant</p>
                  <p className="text-white text-2xl font-bold">
                    {filteredInfrastructures?.filter((i) => i.in_out === "OUT")
                      .length || 0}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl">
                  <span className="text-orange-400 font-bold text-sm">OUT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-b border-slate-600/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Noeud
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Réseau
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Port
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Direction
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Protocole
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {currentItems?.map((infra) => (
                    <tr
                      key={infra.id}
                      className="hover:bg-slate-700/30 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {infra.noeudDesignation}
                          </span>
                          <code className="bg-slate-700/50 text-cyan-400 px-2 py-1 rounded text-xs font-mono mt-1">
                            {infra.noeudId}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {infra.network}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-700/50 text-white px-3 py-1 rounded-lg font-mono text-sm">
                          {infra.port}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getInOutBadge(
                            infra.in_out
                          )}`}
                        >
                          {infra.in_out === "IN" ? "↓ Entrant" : "↑ Sortant"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getProtocolBadge(
                            infra.protocol
                          )}`}
                        >
                          {infra.protocol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {/* Only show edit button if user is admin or has access to this noeud */}
                          {(isAdmin ||
                            filteredNoeuds.some(
                              (n) => n.id === infra.noeudId
                            )) && (
                            <button
                              className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-200 transform hover:scale-105"
                              onClick={() => handleOpenModal("update", infra)}
                              title="Modifier"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                          )}
                          {/* Only show delete button if user is admin or has access to this noeud */}
                          {(isAdmin ||
                            filteredNoeuds.some(
                              (n) => n.id === infra.noeudId
                            )) && (
                            <button
                              className="p-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-lg shadow-red-500/30 transition-all duration-200 transform hover:scale-105"
                              onClick={() => handleOpenDeleteModal(infra)}
                              title="Supprimer"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!currentItems || currentItems.length === 0) && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        {keyword ? (
                          "Aucune infrastructure trouvée pour cette recherche"
                        ) : filteredNoeuds.length === 0 && !isAdmin ? (
                          <div className="flex flex-col items-center space-y-2">
                            <FaInfoCircle className="h-8 w-8 text-slate-500" />
                            <p>Aucune infrastructure trouvée</p>
                            <p className="text-sm text-slate-500">
                              Vous n'êtes pas chef de projet sur aucun projet
                            </p>
                          </div>
                        ) : (
                          "Aucune infrastructure configurée"
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-slate-800/30 border-t border-slate-700/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-slate-400">
                    <span>
                      Affichage de {startIndex + 1} à{" "}
                      {Math.min(endIndex, totalItems)} sur {totalItems}{" "}
                      résultats
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        currentPage === 1
                          ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                          : "bg-slate-700 hover:bg-slate-600 text-white shadow-lg hover:scale-105"
                      }`}
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              currentPage === page
                                ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                                : "bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        currentPage === totalPages
                          ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                          : "bg-slate-700 hover:bg-slate-600 text-white shadow-lg hover:scale-105"
                      }`}
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                        ? "Ajouter une Infrastructure"
                        : "Modifier l'Infrastructure"}
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
                      {modalMode === "create" && (
                        <div>
                          <label
                            htmlFor="noeudId"
                            className="block text-sm font-medium text-slate-300 mb-2"
                          >
                            Noeud <span className="text-red-400">*</span>
                          </label>
                          {filteredNoeuds.length > 0 ? (
                            <select
                              id="noeudId"
                              name="noeudId"
                              value={formData.noeudId}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                            >
                              <option
                                value=""
                                className="bg-slate-700 text-slate-400"
                              >
                                Sélectionner un noeud...
                              </option>
                              {filteredNoeuds?.map((noeud) => (
                                <option
                                  key={noeud.id}
                                  value={noeud.id}
                                  className="bg-slate-700 text-white"
                                >
                                  {noeud.designation}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-400">
                              Aucun noeud disponible - vous devez être chef de
                              projet pour créer une infrastructure
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="network"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Réseau <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="network"
                          name="network"
                          type="text"
                          value={formData.network}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                          placeholder="ex: 192.168.1.0/24"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="port"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Port <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="port"
                          name="port"
                          type="number"
                          min="1"
                          max="65535"
                          value={formData.port}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 font-mono"
                          placeholder="ex: 80, 443, 8080"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="in_out"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Direction du Trafic{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="in_out"
                          name="in_out"
                          value={formData.in_out}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                        >
                          <option
                            value="IN"
                            className="bg-slate-700 text-white"
                          >
                            ↓ Entrant (IN)
                          </option>
                          <option
                            value="OUT"
                            className="bg-slate-700 text-white"
                          >
                            ↑ Sortant (OUT)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="protocol"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Protocole <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="protocol"
                          name="protocol"
                          value={formData.protocol}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                        >
                          <option
                            value="TCP"
                            className="bg-slate-700 text-white"
                          >
                            TCP
                          </option>
                          <option
                            value="UDP"
                            className="bg-slate-700 text-white"
                          >
                            UDP
                          </option>
                          <option
                            value="HTTP"
                            className="bg-slate-700 text-white"
                          >
                            HTTP
                          </option>
                          <option
                            value="HTTPS"
                            className="bg-slate-700 text-white"
                          >
                            HTTPS
                          </option>
                          <option
                            value="SSH"
                            className="bg-slate-700 text-white"
                          >
                            SSH
                          </option>
                          <option
                            value="FTP"
                            className="bg-slate-700 text-white"
                          >
                            FTP
                          </option>
                          <option
                            value="SMTP"
                            className="bg-slate-700 text-white"
                          >
                            SMTP
                          </option>
                          <option
                            value="DNS"
                            className="bg-slate-700 text-white"
                          >
                            DNS
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
                        {filteredNoeuds.length > 0 && (
                          <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800"
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

          {/* Custom Delete Confirmation Modal */}
          {isDeleteModalOpen && selectedInfrastructure && (
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
                        Supprimer l'infrastructure
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">
                        Êtes-vous sûr de vouloir supprimer cette infrastructure
                        ? Cette action est irréversible.
                      </p>
                      <div className="bg-slate-700/50 rounded-lg p-4 mb-6 text-left">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Noeud:</span>
                            <span className="text-white">
                              {getNoeudDesignation(
                                selectedInfrastructure.noeudId
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Réseau:</span>
                            <span className="text-white">
                              {selectedInfrastructure.network}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Port:</span>
                            <span className="text-white font-mono">
                              {selectedInfrastructure.port}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Protocole:</span>
                            <span className="text-white">
                              {selectedInfrastructure.protocol}
                            </span>
                          </div>
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
