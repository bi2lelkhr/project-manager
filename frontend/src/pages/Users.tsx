import { useFetcher } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import SidebarWithIcons from "../components/sidebar";
import { useUsersQuery } from "../features/users/userSlice";
import { Label, Table, TextInput, Modal, Button, Select } from "flowbite-react";
import { useSelector } from "react-redux";
import { AuthState } from "../features/auth/auth-slice";
import { FaSearch, FaChevronLeft, FaChevronRight, FaPlus, FaTimes, FaCog, FaCode, FaTrash } from "react-icons/fa";
import { HiMail, HiUser } from "react-icons/hi";
import { useState, useMemo, SetStateAction } from "react";
import Navbar from "../components/navBar";
import { 
  useFetchAllDevStacksQuery, 
  useAssignDevToStackMutation,
  useFetchDevStacksByDeveloperQuery,
  useUnassignDevFromStackMutation
} from "../features/projects/projectsSlice";
import { DevStack, DeveloppersStack } from "../models/ProjectSliceModels";

export default function Users() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const { data, isError } = useUsersQuery();
  const { data: devStacks } = useFetchAllDevStacksQuery();
  const [assignDevToStack] = useAssignDevToStackMutation();
  const [unassignDevFromStack] = useUnassignDevFromStackMutation(); 
  
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedDevStack, setSelectedDevStack] = useState("");
  const [stackToDelete, setStackToDelete] = useState<{ userId: string; devStackId: string; stackName: string } | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  
  const usersPerPage = 6;

  console.log(auth);

  // Filter and paginate users
  const { paginatedUsers, totalPages, totalUsers } = useMemo(() => {
    if (!data) return { paginatedUsers: [], totalPages: 0, totalUsers: 0 };

    // Filter users based on search keyword
    const filteredUsers = data.filter((user) =>
      user.username.toUpperCase().includes(keyword.toUpperCase())
    );

    // Calculate pagination
    const total = filteredUsers.length;
    const pages = Math.ceil(total / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const paginated = filteredUsers.slice(startIndex, endIndex);

    return {
      paginatedUsers: paginated,
      totalPages: pages,
      totalUsers: total
    };
  }, [data, keyword, currentPage]);

  // Reset to first page when search keyword changes
  const handleSearchChange = (newKeyword: SetStateAction<string>) => {
    setKeyword(newKeyword);
    setCurrentPage(1);
  };

  // Pagination handlers
  const goToPage = (page: SetStateAction<number>) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Get user's current dev stacks for filtering
  const { data: currentUserDevStacks } = useFetchDevStacksByDeveloperQuery(
    { userId: selectedUser?.id || "" },
    { skip: !selectedUser?.id }
  );

  // Filter out already assigned dev stacks
  const availableDevStacks = useMemo(() => {
    if (!devStacks || !currentUserDevStacks) return devStacks || [];
    
    const assignedStackIds = currentUserDevStacks
      .map(ds => ds.dev_stack?.id)
      .filter(Boolean);
    
    return devStacks.filter(stack => !assignedStackIds.includes(stack.id));
  }, [devStacks, currentUserDevStacks]);

  // Handle assign dev stack
  const handleAssignDevStack = async () => {
    if (!selectedUser || !selectedDevStack) return;

    try {
      await assignDevToStack({
        userId: selectedUser.id,
        devStackId: selectedDevStack
      }).unwrap();
      
      setShowAssignModal(false);
      setSelectedUser(null);
      setSelectedDevStack("");
      
      console.log("DevStack assigned successfully");
    } catch (error) {
      console.error("Failed to assign DevStack:", error);
    }
  };

  // Handle delete dev stack
  const handleDeleteDevStack = async () => {
    if (!stackToDelete) return;

    try {
      await unassignDevFromStack({
        userId: stackToDelete.userId,
        devStackId: stackToDelete.devStackId
      }).unwrap();
      
      setShowDeleteModal(false);
      setStackToDelete(null);
      
      console.log("DevStack removed successfully");
    } catch (error) {
      console.error("Failed to remove DevStack:", error);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (userId: string, devStackId: string, stackName: string) => {
    setStackToDelete({ userId, devStackId, stackName });
    setShowDeleteModal(true);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Component for displaying user's dev stacks
  const UserDevStacks = ({ userId }: { userId: string }) => {
    const { data: userDevStacks, isLoading, isFetching } = useFetchDevStacksByDeveloperQuery(
      { userId },
      {
        refetchOnMountOrArgChange: true,
      }
    );

    console.log(`Fetching dev stacks for user: ${userId}`, userDevStacks);

    if (isLoading || isFetching) {
      return (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
        </div>
      );
    }

    if (!userDevStacks || userDevStacks.length === 0) {
      return (
        <div className="text-slate-400 text-sm py-2">
          Aucune technologie assignée
        </div>
      );
    }

    return (
      <div className="space-y-2 py-2">
        <div className="text-slate-300 text-sm font-medium mb-2">
          Technologies assignées ({userDevStacks.length}):
        </div>
        <div className="flex flex-wrap gap-2">
          {userDevStacks.map((devStack) => {
            if (!devStack.dev_stack) return null;
            
            return (
              <div
                key={`${userId}-${devStack.id}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-400/30 group"
              >
                <FaCode className="h-3 w-3 mr-1" />
                {devStack.dev_stack.framework} - {devStack.dev_stack.programming_language}
                {devStack.dev_stack.version && (
                  <span className="ml-1 text-purple-400">v{devStack.dev_stack.version}</span>
                )}
                <button
                  onClick={() => openDeleteModal(
                    userId,
                    devStack.dev_stack!.id,
                    `${devStack.dev_stack!.framework} - ${devStack.dev_stack!.programming_language}`
                  )}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-red-400"
                  title="Supprimer cette technologie"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-row min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <SidebarWithIcons />
      <div className="flex-1 min-w-screen">
        <Navbar
          username={auth.username}
          role={auth.role}
          onSearchChange={handleSearchChange}
        />

        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg">
                <HiUser className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                Liste des utilisateurs
              </h2>
            </div>
            <div className="text-slate-400 text-sm">
              {totalUsers > 0 && (
                <>
                  Affichage de {((currentPage - 1) * usersPerPage) + 1} à{' '}
                  {Math.min(currentPage * usersPerPage, totalUsers)} sur {totalUsers} utilisateurs
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-b border-slate-600/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Profession
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paginatedUsers.map((user) => (
                    <>
                      <tr
                        key={`user-${user.id}`}
                        className="hover:bg-slate-700/30 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 text-slate-300 font-medium">
                          {user.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <img
                                src={`https://ui-avatars.com/api/?name=${user.username}&rounded=true&size=40&background=1e293b&color=ffffff`}
                                alt={user.username}
                                className="w-10 h-10 rounded-full border-2 border-slate-600"
                              />
                              {user.is_developper && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800" 
                                     title="Développeur" />
                              )}
                            </div>
                            <div>
                              <span className="text-white font-medium block">
                                {user.username}
                              </span>
                              <div className="flex items-center space-x-2 text-xs">
                                {user.is_developper && (
                                  <span className="text-green-400">Développeur</span>
                                )}
                                {user.is_admin && (
                                  <span className="text-red-400">Admin</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 text-slate-300">
                            <HiMail className="h-4 w-4 text-slate-400" />
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            {user.job_title}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {user.is_developper && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowAssignModal(true);
                                }}
                                className="flex items-center px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-500/20 border border-purple-400/30 rounded-lg hover:bg-purple-500/30 transition-colors duration-200"
                              >
                                <FaPlus className="h-3 w-3 mr-1" />
                                Assigner Tech
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                              className="flex items-center px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-600/50 border border-slate-500/30 rounded-lg hover:bg-slate-600/70 transition-colors duration-200"
                            >
                              <FaCog className="h-3 w-3 mr-1" />
                              {expandedUserId === user.id ? 'Masquer' : 'Détails'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedUserId === user.id && (
                        <tr key={`expanded-${user.id}`} className="bg-slate-700/20">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="border-l-4 border-blue-500 pl-4">
                              <h4 className="text-white font-medium mb-2">
                                Détails de {user.username}
                              </h4>
                              {user.is_developper ? (
                                <UserDevStacks userId={user.id} key={`devstack-${user.id}-${expandedUserId}`} />
                              ) : (
                                <div className="text-slate-400 text-sm">
                                  Cet utilisateur n'est pas un développeur
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedUsers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-slate-400 text-lg mb-2">
                  Aucun utilisateur trouvé
                </div>
                <div className="text-slate-500 text-sm">
                  {keyword ? `Aucun résultat pour "${keyword}"` : "Aucune donnée disponible"}
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 text-sm">
                    Page {currentPage} sur {totalPages}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="flex items-center px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <FaChevronLeft className="h-3 w-3 mr-1" />
                      Précédent
                    </button>

                    <div className="hidden sm:flex items-center space-x-1">
                      {getPageNumbers().map((pageNum, index) => (
                        <button
                          key={`page-${pageNum}-${index}`}
                          onClick={() => typeof pageNum === 'number' && goToPage(pageNum)}
                          disabled={pageNum === '...'}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            pageNum === currentPage
                              ? 'bg-blue-600 text-white border border-blue-500'
                              : pageNum === '...'
                              ? 'text-slate-400 cursor-default'
                              : 'text-slate-300 bg-slate-700/50 border border-slate-600/50 hover:bg-slate-600/50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="flex items-center px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Suivant
                      <FaChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assign DevStack Modal */}
        <Modal show={showAssignModal} onClose={() => setShowAssignModal(false)} size="md">
          <Modal.Header className="bg-slate-800 border-b border-slate-700">
            <span className="text-white">Assigner une technologie</span>
          </Modal.Header>
          <Modal.Body className="bg-slate-800">
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-lg">
                  <img
                    src={`https://ui-avatars.com/api/?name=${selectedUser.username}&rounded=true&size=40&background=1e293b&color=ffffff`}
                    alt={selectedUser.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="text-white font-medium">{selectedUser.username}</div>
                    <div className="text-slate-400 text-sm">{selectedUser.email}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Sélectionner une technologie
                  </label>
                  {availableDevStacks.length > 0 ? (
                    <select
                      value={selectedDevStack}
                      onChange={(e) => setSelectedDevStack(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Choisir une technologie --</option>
                      {availableDevStacks.map((stack) => (
                        <option key={stack.id} value={stack.id}>
                          {stack.framework} - {stack.programming_language}
                          {stack.version && ` v${stack.version}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-slate-700/50 border border-slate-600/50 text-slate-400 rounded-lg px-4 py-3 text-sm">
                      Toutes les technologies disponibles ont déjà été assignées à cet utilisateur.
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="bg-slate-800 border-t border-slate-700">
            <div className="flex justify-end space-x-3">
              <Button
                color="gray"
                onClick={() => setShowAssignModal(false)}
                className="bg-slate-600 hover:bg-slate-500 text-white border-slate-500"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAssignDevStack}
                disabled={!selectedDevStack || availableDevStacks.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assigner
              </Button>
            </div>
          </Modal.Footer>
        </Modal>

        {/* Delete DevStack Confirmation Modal */}
        <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
          <Modal.Header className="bg-slate-800 border-b border-slate-700">
            <span className="text-white">Confirmer la suppression</span>
          </Modal.Header>
          <Modal.Body className="bg-slate-800">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <FaTrash className="h-6 w-6 text-red-400" />
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">
                    Êtes-vous sûr de vouloir supprimer cette technologie ?
                  </p>
                  <p className="text-slate-400 text-sm">
                    {stackToDelete?.stackName}
                  </p>
                </div>
              </div>
              <p className="text-slate-300 text-sm">
                Cette action est irréversible. La technologie sera retirée de l'utilisateur.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className="bg-slate-800 border-t border-slate-700">
            <div className="flex justify-end space-x-3">
              <Button
                color="gray"
                onClick={() => setShowDeleteModal(false)}
                className="bg-slate-600 hover:bg-slate-500 text-white border-slate-500"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeleteDevStack}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <FaTrash className="h-3 w-3 mr-2" />
                Supprimer
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}