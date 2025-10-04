import { useState } from "react";
import { useAppSelector } from "../app/hooks";
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
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { HiViewBoards } from "react-icons/hi";
import {
  useAddQuartierMutation,
  useFetchQuartiersQuery,
  useFetchZonesQuery,
  useUpdateQuartierMutation,
} from "../features/projects/projectsSlice";
import { toast } from "sonner";
import SidebarWithIcons from "../components/sidebar";
import Navbar from "../components/navBar";
import type { Quartier as ProjectSliceQuartier } from "../models/ProjectSliceModels";

interface Quartier extends ProjectSliceQuartier {
  _count?: {
    Project: number;
  };
}

interface QuartierFormData {
  id: string;
  code_quartier: string;
  nom: string;
  description: string | null;
  zoneId: string;
}

export default function Quartiers() {
  const auth = useAppSelector((state) => state.auth);
  const { data, refetch } = useFetchQuartiersQuery();
  const [keyword, setKeyword] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "update" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [addQuartier] = useAddQuartierMutation();
  const [updateQuartier] = useUpdateQuartierMutation();
  const { data: zones } = useFetchZonesQuery();

  const [formData, setFormData] = useState<QuartierFormData>({
    id: "",
    code_quartier: "",
    nom: "",
    description: null,
    zoneId: "",
  });

  // Filter data based on keyword
  const filteredData =
    data?.filter((e) => e.nom.toUpperCase().includes(keyword.toUpperCase())) ||
    [];

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
    initialData?: Quartier
  ) => {
    setModalMode(mode);
    setIsModalOpen(true);

    if (initialData) {
      setFormData({
        id: initialData.id,
        code_quartier: initialData.code_quartier,
        nom: initialData.nom,
        description: initialData.description || null,
        zoneId: initialData.zoneId,
      });
    } else {
      setFormData({
        id: "",
        code_quartier: "",
        nom: "",
        description: null,
        zoneId: "",
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setFormData({
      id: "",
      code_quartier: "",
      nom: "",
      description: null,
      zoneId: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value === "" ? null : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (modalMode === "create") {
        await addQuartier(formData).unwrap();
      } else if (modalMode === "update") {
        await updateQuartier(formData).unwrap();
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
                <HiViewBoards className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Liste des quartiers
              </h2>
            </div>

            <button
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
              onClick={() => handleOpenModal("create")}
            >
              <FaPlus className="h-4 w-4" />
              <span>Ajouter un quartier</span>
            </button>
          </div>

          {/* Results Info */}
          <div className="mb-6">
            <p className="text-slate-300 text-sm">
              Affichage de {startIndex + 1} à{" "}
              {Math.min(endIndex, filteredData.length)} sur{" "}
              {filteredData.length} quartiers
            </p>
          </div>

          {/* Table Container */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-b border-slate-600/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Zone
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Nombre de projets
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
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        Aucun quartier trouvé
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((e: Quartier) => (
                      <tr
                        key={e.id}
                        className="hover:bg-slate-700/30 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 text-white font-medium">
                          {e.nom}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {e.description || "Aucune description"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30">
                            {e.zone.nom}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            {e._count?.Project || 0} projets
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-200 transform hover:scale-105"
                            onClick={() => handleOpenModal("update", e)}
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
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

                        // Show first page, last page, current page, and pages around current page
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

                        // Show ellipsis for gaps
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

          {/* Custom Modal */}
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
                        ? "Ajouter un quartier"
                        : "Modifier un quartier"}
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
                          htmlFor="code_quartier"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Code Quartier
                        </label>
                        <input
                          id="code_quartier"
                          name="code_quartier"
                          type="text"
                          maxLength={10}
                          value={formData.code_quartier}
                          onChange={handleChange}
                          placeholder="Entrez le code du quartier"
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        />
                        <p className="mt-1 text-sm text-slate-400">
                          Maximum 10 caractères
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="nom"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Nom
                        </label>
                        <input
                          id="nom"
                          name="nom"
                          type="text"
                          value={formData.nom}
                          onChange={handleChange}
                          placeholder="Entrez le nom du quartier"
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
                          htmlFor="zoneId"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Zone
                        </label>
                        <select
                          id="zoneId"
                          name="zoneId"
                          value={formData.zoneId}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        >
                          <option
                            value=""
                            className="bg-slate-700 text-slate-400"
                          >
                            Sélectionnez une zone
                          </option>
                          {zones?.map((zone: any) => (
                            <option
                              key={zone.id}
                              value={zone.id}
                              className="bg-slate-700 text-white"
                            >
                              {zone.nom}
                            </option>
                          ))}
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
        </div>
      </div>
    </div>
  );
}
