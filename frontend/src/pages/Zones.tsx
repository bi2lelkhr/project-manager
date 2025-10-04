import { useFetcher } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import SidebarWithIcons from "../components/sidebar";
import { useUsersQuery } from "../features/users/userSlice";
import { Button, Label, Table, Textarea, TextInput } from "flowbite-react";
import { useSelector } from "react-redux";
import { AuthState } from "../features/auth/auth-slice";
import { FaEdit, FaEraser, FaPlus, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { HiMail, HiInbox } from "react-icons/hi";
import { useState, useEffect } from "react"; 
import { FaDiagramProject } from "react-icons/fa6";
import { AvatarImage } from "../components/Avatar";
import Navbar from "../components/navBar";
import {
  useAddZoneMutation,
  useFetchZonesQuery,
  useUpdateZoneMutation,
} from "../features/projects/projectsSlice";
import { toast } from "sonner";

export default function Zones() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const { data, refetch, isError } = useFetchZonesQuery();

  const [addZone] = useAddZoneMutation();
  const [updateZone] = useUpdateZoneMutation();

  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // 5 items per page

  const [modalMode, setModalMode] = useState<"create" | "update" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Final corrected FormData interface
  interface FormData {
    id: string;
    code_zone: string;
    nom: string;
    description?: string;
  }

  const [formData, setFormData] = useState<FormData>({
    id: "",
    code_zone: "",
    nom: "",
    description: "",
  });

  // Filter data based on search keyword
  const filteredData = data?.filter((e) =>
    e.nom.toUpperCase().includes(keyword.toUpperCase())
  ) || [];

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

  // Reset to first page when search changes - FIXED: using useEffect instead of useState
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  const handleOpenModal = (
    mode: "create" | "update",
    initialData?: FormData
  ) => {
    setModalMode(mode);
    setIsModalOpen(true);
    setFormData(
      initialData || {
        id: "",
        code_zone: "",
        nom: "",
        description: "",
      }
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setFormData({
      id: "",
      code_zone: "",
      nom: "",
      description: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      let res;
      if (modalMode === "create") {
        res = await addZone(formData).unwrap();
      } else if (modalMode === "update") {
        res = await updateZone(formData).unwrap();
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
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg">
                <HiInbox className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Liste des zones</h2>
            </div>

            <button
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
              onClick={() => handleOpenModal("create")}
            >
              <FaPlus className="h-4 w-4" />
              <span>Ajouter une zone</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-b border-slate-600/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Quartiers
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
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                            {e.code_zone}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white font-medium">
                          {e.nom}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {e.description}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {e.quartiers.length > 0 ? (
                              e.quartiers.map((quartier) => (
                                <div
                                  key={quartier.id}
                                  className="flex items-center space-x-2"
                                >
                                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                                  <span className="text-slate-300 text-sm">
                                    {quartier.nom}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-500 text-sm italic">
                                Aucun quartier
                              </span>
                            )}
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
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        {filteredData.length === 0 && data && data.length > 0
                          ? "Aucun résultat trouvé pour votre recherche"
                          : "Aucune zone disponible"}
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
                  Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)} sur {totalItems} éléments
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
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
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
                      {modalMode === "create"
                        ? "Ajouter une zone"
                        : "Modifier une zone"}
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
                      {/* Code Zone Input */}
                      <div>
                        <label
                          htmlFor="code_zone"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Code Zone
                        </label>
                        <input
                          id="code_zone"
                          name="code_zone"
                          type="text"
                          maxLength={10}
                          value={formData.code_zone}
                          onChange={handleChange}
                          placeholder="Enter zone code"
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        />
                        <p className="mt-1 text-sm text-slate-400">
                          Maximum 10 characters
                        </p>
                      </div>

                      {/* Name Input */}
                      <div>
                        <label
                          htmlFor="nom"
                          className="block text-sm font-medium text-slate-300 mb-2"
                        >
                          Name
                        </label>
                        <input
                          id="nom"
                          name="nom"
                          type="text"
                          value={formData.nom}
                          onChange={handleChange}
                          placeholder="Enter name"
                          required
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        />
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
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Enter description (optional)"
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
                            ? "Créer la zone"
                            : "Mettre à jour la zone"}
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