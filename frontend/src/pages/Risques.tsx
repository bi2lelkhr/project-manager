import { useFetcher } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import SidebarWithIcons from "../components/sidebar";
import { useUsersQuery } from "../features/users/userSlice";
import {
  Button,
  Label,
  Select,
  Table,
  Textarea,
  TextInput,
} from "flowbite-react";
import { useSelector } from "react-redux";
import { AuthState } from "../features/auth/auth-slice";
import {
  FaEdit,
  FaEraser,
  FaPlus,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { HiMail } from "react-icons/hi";
import { useState, useEffect } from "react";
import { FaDiagramProject } from "react-icons/fa6";
import { AvatarImage } from "../components/Avatar";
import {
  useAddRisqueMutation,
  useFetchRisquesQuery,
  useUpdateRisqueMutation,
} from "../features/projects/projectsSlice";
import { CgDanger } from "react-icons/cg";
import { toast } from "sonner";
import Navbar from "../components/navBar";

export interface RisqueFormData {
  id: string;
  name: string;
  description: string | null;
  severity: number;
}

export default function Risques() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const { data, refetch, isError } = useFetchRisquesQuery();
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // 5 items per page

  // Keep track of which modal is open using a single state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "update" | null>(null);

  const [addRisque] = useAddRisqueMutation();
  const [updateRisque] = useUpdateRisqueMutation();

  const [formData, setFormData] = useState<RisqueFormData>({
    id: "",
    name: "",
    description: "",
    severity: 1,
  });

  // Filter data based on search keyword
  const filteredData =
    data?.filter((e) => e.name.toUpperCase().includes(keyword.toUpperCase())) ||
    [];

  // Calculate pagination values
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  // Open modal handler that accepts mode and optional initial data
  const handleOpenModal = (
    mode: "create" | "update",
    initialData?: RisqueFormData
  ) => {
    setModalMode(mode);
    setIsModalOpen(true);

    // If updating, populate form with initial data; otherwise reset
    setFormData(
      initialData || {
        id: "",
        name: "",
        description: "",
        severity: 1,
      }
    );
  };

  // Close modal handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    // Optional: Reset form data when closing
    setFormData({
      id: "",
      name: "",
      description: "",
      severity: 1,
    });
  };

  // Handle changes for input, textarea, and select
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      let res;
      if (modalMode === "create") {
        res = await addRisque(formData).unwrap();
      } else if (modalMode === "update") {
        res = await updateRisque(formData).unwrap();
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

  // Helper function to get severity color
  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1:
        return "bg-green-500/20 text-green-300 border-green-400/30";
      case 2:
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";
      case 3:
        return "bg-orange-500/20 text-orange-300 border-orange-400/30";
      case 4:
        return "bg-red-500/20 text-red-300 border-red-400/30";
      case 5:
        return "bg-red-600/20 text-red-200 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-400/30";
    }
  };

  const getSeverityLabel = (severity: number) => {
    const labels = {
      1: "Très faible",
      2: "Faible",
      3: "Modérée",
      4: "Élevée",
      5: "Critique",
    };
    return labels[severity as keyof typeof labels] || "Inconnue";
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
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
              <div className="p-3 bg-gradient-to-r from-red-600 to-red-500 rounded-xl shadow-lg">
                <CgDanger className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Liste des Risques
              </h2>
            </div>

            <button
              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-105"
              onClick={() => handleOpenModal("create")}
            >
              <FaPlus className="h-4 w-4" />
              <span>Ajouter un Risque</span>
            </button>
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
                      Sévérité
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {currentItems.length > 0 ? (
                    currentItems.map((e) => (
                      <tr
                        key={e.id}
                        className="hover:bg-slate-700/30 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 text-white font-medium">
                          {e.name}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {e.description || "Aucune description"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                                e.severity
                              )}`}
                            >
                              {getSeverityLabel(e.severity)} ({e.severity}/5)
                            </span>
                          </div>
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
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-slate-400"
                      >
                        {filteredData.length === 0 && data && data.length > 0
                          ? "Aucun résultat trouvé pour votre recherche"
                          : "Aucun risque disponible"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50 bg-slate-800/30">
                <div className="text-sm text-slate-400">
                  Affichage de {startIndex + 1} à{" "}
                  {Math.min(endIndex, totalItems)} sur {totalItems} éléments
                </div>

                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
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
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === page
                          ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30"
                          : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
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
                      {`${
                        modalMode == "create" ? "Ajouter" : "Modifier"
                      } un risque`}
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
                      {/* Name Input */}
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Désignation
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          maxLength={100}
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Désignation du risque"
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        />
                        <p className="mt-1 text-sm text-slate-400">
                          Maximum 100 caractères
                        </p>
                      </div>

                      {/* Severity Input */}
                      <div>
                        <label
                          htmlFor="severity"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Sévérité
                        </label>
                        <select
                          id="severity"
                          name="severity"
                          value={formData.severity}
                          onChange={(e) => {
                            setFormData((prevState) => ({
                              ...prevState,
                              severity: parseInt(e.target.value),
                            }));
                          }}
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        >
                          <option value={1} className="bg-slate-700 text-white">
                            1 - Très faible
                          </option>
                          <option value={2} className="bg-slate-700 text-white">
                            2 - Faible
                          </option>
                          <option value={3} className="bg-slate-700 text-white">
                            3 - Modérée
                          </option>
                          <option value={4} className="bg-slate-700 text-white">
                            4 - Élevée
                          </option>
                          <option value={5} className="bg-slate-700 text-white">
                            5 - Critique
                          </option>
                        </select>
                      </div>

                      {/* Description Input */}
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
                          placeholder="Description du risque (optionnel)"
                          rows={4}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 resize-none"
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
                          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        >
                          {modalMode === "create"
                            ? "Créer le risque"
                            : "Mettre à jour le risque"}
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
