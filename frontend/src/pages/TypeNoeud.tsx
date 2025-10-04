import { useState } from "react";
import { useAppSelector } from "../app/hooks";
import {
  FaEdit,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
} from "react-icons/fa";
import { BiNetworkChart } from "react-icons/bi";
import {
  useAddTypeNoeudMutation,
  useFetchAllTypeNoeudsQuery,
  useUpdateTypeNoeudMutation,
  useDeleteTypeNoeudMutation,
} from "../features/projects/projectsSlice";
import { useFetchAllNoeudsQuery } from "../features/projects/projectsSlice";
import { toast } from "sonner";
import SidebarWithIcons from "../components/sidebar";
import Navbar from "../components/navBar";
import type { TypeNoeud } from "../models/ProjectSliceModels";

interface TypeNoeudFormData {
  id?: string;
  designation: string;
  description?: string;
}

export default function TypeNoeuds() {
  const auth = useAppSelector((state) => state.auth);
  const { data, refetch } = useFetchAllTypeNoeudsQuery();
  
  const { data: allNoeuds } = useFetchAllNoeudsQuery();

  const [keyword, setKeyword] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "update" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [addTypeNoeud] = useAddTypeNoeudMutation();
  const [updateTypeNoeud] = useUpdateTypeNoeudMutation();
  const [deleteTypeNoeud] = useDeleteTypeNoeudMutation();

  const [formData, setFormData] = useState<TypeNoeudFormData>({
    id: "",
    designation: "",
    description: "",
  });

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTypeNoeud, setSelectedTypeNoeud] = useState<TypeNoeud | null>(
    null
  );

  //  function to check if TypeNoeud is used by any Noeud
  const isTypeNoeudUsed = (typeNoeudId: string): boolean => {
    return (
      allNoeuds?.some((noeud) => noeud.typeNoeudId === typeNoeudId) || false
    );
  };

  // Filter data based on keyword
  const filteredData =
    data?.filter(
      (e) =>
        e.designation?.toUpperCase().includes(keyword.toUpperCase()) ||
        e.description?.toUpperCase().includes(keyword.toUpperCase())
    ) || [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when keyword changes
  const handleKeywordChange = (newKeyword: string) => {
    setKeyword(newKeyword);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleOpenModal = (
    mode: "create" | "update",
    initialData?: TypeNoeud
  ) => {
    setModalMode(mode);
    setIsModalOpen(true);

    if (initialData) {
      setFormData({
        id: initialData.id,
        designation: initialData.designation || "",
        description: initialData.description || "",
      });
    } else {
      setFormData({
        id: "",
        designation: "",
        description: "",
      });
    }
  };

  // Modify the handleOpenDeleteModal function to check if TypeNoeud is used
  const handleOpenDeleteModal = (typeNoeud: TypeNoeud) => {
    // Check if the typeNoeud is being used by any noeud
    if (isTypeNoeudUsed(typeNoeud.id)) {
      toast.error(
        "Ce type de nœud est utilisé par un ou plusieurs nœuds et ne peut pas être supprimé",
        {
          position: "top-center",
          duration: 5000,
        }
      );
      return;
    }

    setSelectedTypeNoeud(typeNoeud);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setFormData({
      id: "",
      designation: "",
      description: "",
    });
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTypeNoeud(null);
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
        await addTypeNoeud(formData).unwrap();
      } else if (modalMode === "update") {
        await updateTypeNoeud(formData).unwrap();
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

  const handleDelete = async () => {
    if (!selectedTypeNoeud) return;

    // Add an extra safety check before deletion
    if (isTypeNoeudUsed(selectedTypeNoeud.id)) {
      toast.error(
        "Impossible de supprimer : ce type de nœud est encore utilisé",
        {
          position: "top-center",
          duration: 5000,
        }
      );
      handleCloseDeleteModal();
      return;
    }

    try {
      await deleteTypeNoeud({ id: selectedTypeNoeud.id }).unwrap();
      handleCloseDeleteModal();
      refetch();
      toast.success("Type de nœud supprimé avec succès!", {
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
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg">
                <BiNetworkChart className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Types de Nœud</h2>
            </div>

            <button
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
              onClick={() => handleOpenModal("create")}
            >
              <FaPlus className="h-4 w-4" />
              <span>Ajouter un type</span>
            </button>
          </div>

          {/* Results Info */}
          <div className="mb-6">
            <p className="text-slate-300 text-sm">
              Affichage de {startIndex + 1} à{" "}
              {Math.min(endIndex, filteredData.length)} sur{" "}
              {filteredData.length} types de nœud
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
                      Description
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
                        colSpan={4}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        Aucun type de nœud trouvé
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((e: TypeNoeud) => {
                      const isUsed = isTypeNoeudUsed(e.id);
                      return (
                        <tr
                          key={e.id}
                          className="hover:bg-slate-700/30 transition-colors duration-200"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-lg mr-3">
                                <BiNetworkChart className="w-4 h-4 text-blue-400" />
                              </div>
                              <span className="text-white font-medium">
                                {e.designation}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {e.description || "Aucune description"}
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
                              <button
                                className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-200 transform hover:scale-105"
                                onClick={() => handleOpenModal("update", e)}
                                title="Modifier"
                              >
                                <FaEdit className="h-4 w-4" />
                              </button>
                              <button
                                className={`p-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 ${
                                  isUsed
                                    ? "bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed opacity-50"
                                    : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                }`}
                                onClick={() => handleOpenDeleteModal(e)}
                                title={
                                  isUsed
                                    ? "Impossible de supprimer - type utilisé"
                                    : "Supprimer"
                                }
                                disabled={isUsed}
                              >
                                <FaTrash className="h-4 w-4 text-white" />
                              </button>
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

          {/* Pagination Row - unchanged */}
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
                                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
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

          {/* Custom Modal - unchanged */}
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
                        ? "Ajouter un type de nœud"
                        : "Modifier le type de nœud"}
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
                          htmlFor="designation"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Désignation
                        </label>
                        <input
                          id="designation"
                          name="designation"
                          type="text"
                          value={formData.designation}
                          onChange={handleChange}
                          placeholder="Entrez la désignation (ex: Serveur, Router, Firewall)"
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Description (optionnel)
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description || ""}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Entrez une description du type de nœud"
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
                          {modalMode === "create" ? "Créer" : "Modifier"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Delete Confirmation Modal - unchanged */}
          {isDeleteModalOpen && selectedTypeNoeud && (
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
                        Supprimer le type de nœud
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">
                        Êtes-vous sûr de vouloir supprimer ce type de nœud ?
                        Cette action est irréversible.
                      </p>
                      <div className="bg-slate-700/50 rounded-lg p-4 mb-6 text-left">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Désignation:</span>
                            <span className="text-white">
                              {selectedTypeNoeud.designation}
                            </span>
                          </div>
                          {selectedTypeNoeud.description && (
                            <div className="flex flex-col">
                              <span className="text-slate-400 mb-1">
                                Description:
                              </span>
                              <span className="text-white text-sm">
                                {selectedTypeNoeud.description}
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
