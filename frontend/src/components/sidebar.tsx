import React from "react";
import { useLocation } from "react-router-dom";
import { HiUser, HiViewBoards, HiInbox, HiServer } from "react-icons/hi";
import logo from "./../assets/logo.png";
import { FaDiagramProject } from "react-icons/fa6";
import { CgDanger } from "react-icons/cg";
import { GiSprint } from "react-icons/gi";
import { GrDashboard, GrDeploy } from "react-icons/gr";
import { MdDeveloperMode } from "react-icons/md";
import { FaNetworkWired } from "react-icons/fa";
import { BiNetworkChart } from "react-icons/bi";
import { Toaster } from "sonner";
import { useAppSelector } from "../app/hooks";

const SidebarWithIcons = () => {
  const location = useLocation();
  const auth = useAppSelector((state) => state.auth);

  // Define all menu items
  const menuItems = [
    { href: "/home", icon: GrDashboard, label: "Board" },
    { href: "/users", icon: HiUser, label: "Utilisateurs", role: "admin" },
    { href: "/projects", icon: FaDiagramProject, label: "Projets" },
    { href: "/infrastructure", icon: HiServer, label: "Matrice de flux" },
    {
      href: "/quartiers",
      icon: HiViewBoards,
      label: "Quartiers",
      role: "admin",
    },
    { href: "/zones", icon: HiInbox, label: "Zones", role: "admin" },
    { href: "/risques", icon: CgDanger, label: "Risques", role: "admin" },
    { href: "/sprints", icon: GiSprint, label: "Sprints" },
    { href: "/deploiements", icon: GrDeploy, label: "Déploiements" },
    {
      href: "/dev-stack",
      icon: MdDeveloperMode,
      label: "Dev Stack",
      role: "admin",
    },
    { href: "/noeud", icon: FaNetworkWired, label: "Noeud" },
    {
      href: "/type-noeud",
      icon: BiNetworkChart,
      label: "Type Noeud",
      role: "admin",
    },
  ];

  const filteredMenu = menuItems.filter(
    (item) => !item.role || auth.role === "admin"
  );

  return (
    <div className="sidebar-container min-h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
      {/* Logo Section */}
      <div className="logo-section px-4 py-5 border-b border-slate-700/50">
        <div className="flex items-center justify-center">
          <div className="relative">
            <img
              src={logo}
              alt="Logo"
              className="h-10 w-auto filter brightness-110 drop-shadow-lg"
            />
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-20"></div>
          </div>
        </div>
      </div>

      <div className="navigation-items px-3 py-4">
        <nav className="space-y-1.5">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center px-3 py-2.5 rounded-lg transition-all duration-300 ease-in-out
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 transform scale-105"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md hover:transform hover:scale-102"
                  }
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r-full shadow-glow"></div>
                )}

                {/* Icon */}
                <div
                  className={`
                  flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300
                  ${
                    isActive
                      ? "bg-white/20 text-white shadow-inner"
                      : "text-slate-400 group-hover:text-white group-hover:bg-white/10"
                  }
                `}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Label */}
                <span
                  className={`
                  ml-3 font-medium text-sm transition-all duration-300
                  ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-slate-300 group-hover:text-white"
                  }
                `}
                >
                  {item.label}
                </span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgb(30, 41, 59)",
            color: "rgb(248, 250, 252)",
            border: "1px solid rgb(51, 65, 85)",
          },
        }}
      />

      <style>
        {`
          .shadow-glow {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
        `}
      </style>
    </div>
  );
};

export default SidebarWithIcons;
