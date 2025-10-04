
import { FaSearch, FaCog, FaSignOutAlt } from "react-icons/fa";
import { HiMenu } from "react-icons/hi";
import { signOut } from "../features/auth/auth-slice";
import { useAppDispatch } from "../app/hooks";
import { useAppSelector } from "../app/hooks";
import NotificationDropdown from "./NotificationDropdown";

interface NavbarProps {
  username?: string;
  role?: string;
  onSearchChange: (value: string) => void;
}

export default function Navbar({
  username,
  role,
  onSearchChange,
}: NavbarProps) {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(signOut());
  };

  return (
    <div className="navbar-container bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 shadow-xl sticky top-0 z-50">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <img
              src={`https://ui-avatars.com/api/?name=${username}&rounded=true&size=56&background=gradient&color=ffffff`}
              alt="User avatar"
              className="relative w-14 h-14 rounded-full border-2 border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-slate-800 rounded-full"></div>
          </div>

          <div className="hidden sm:block">
            <div className="flex flex-col space-y-2">
              <h1 className="text-lg font-bold text-white leading-tight">
                Salut,{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {username || "User"}
                </span>
              </h1>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {role ? role.charAt(0).toUpperCase() + role.slice(1) : "User"}
                </span>
                <span className="text-sm text-slate-400">• En ligne</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-lg mx-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors duration-200" />
            </div>
            <input
              type="text"
              placeholder="Rechercher dans l'application..."
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-slate-700/70 transition-all duration-300 text-white placeholder-slate-400 hover:bg-slate-700/70 hover:shadow-lg shadow-slate-900/20"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <NotificationDropdown />

          <div className="h-8 w-px bg-slate-600"></div>

          <button
            onClick={handleLogout}
            className="relative flex items-center space-x-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
          >
            <FaSignOutAlt className="h-4 w-4" />
            <span className="hidden md:inline font-medium">Déconnexion</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 to-red-500/0 group-hover:from-red-500/10 group-hover:to-red-500/10 transition-all duration-300"></div>
          </button>
        </div>
      </div>

      <div className="md:hidden px-4 pb-4">
        <button className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors duration-200">
          <HiMenu className="h-5 w-5" />
          <span className="text-sm font-medium">Menu</span>
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
    </div>
  );
}
