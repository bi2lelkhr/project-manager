import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import {
  FaBell,
  FaCheckDouble,
  FaTrash,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";
import {
  useFetchNotificationsQuery,
  useFetchUnreadCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
} from "../features/projects/projectsSlice";
import { useAppSelector } from "../app/hooks";

// Types
type AppNotification = {
  id: string;
  message: string;
  type: string;
  entityId: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
};

const BACKEND_URL = "http://localhost:3001";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState<AppNotification[]>(
    []
  );
  const [toast, setToast] = useState<AppNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const userId = useAppSelector((state) => state.auth.id);
  const token =
    useAppSelector((state) => state.auth.token) ||
    localStorage.getItem("authToken");

  const { data: notificationsData, refetch: refetchNotifications } =
    useFetchNotificationsQuery({ userId: userId || "" }, { skip: !userId });

  const { data: unreadCountData, refetch: refetchUnreadCount } =
    useFetchUnreadCountQuery({ userId: userId || "" }, { skip: !userId });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [deleteAllNotifications] = useDeleteAllNotificationsMutation();

  const notifications =
    (notificationsData as unknown as AppNotification[]) || [];
  const unreadCount = unreadCountData?.unreadCount || 0;

  // --- SOCKET.IO ---
  useEffect(() => {
    if (!userId || !token) {
      console.warn("Missing userId or token for socket connection");
      return;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(BACKEND_URL, {
      auth: {
        token: token,
      },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("join", userId);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });

    socket.on("notification", (data: AppNotification) => {
      console.log("🔔 New live notification:", data);

      // Check if this notification already exists in API data to prevent duplicates
      const alreadyExists = notifications.some((n) => n.id === data.id);

      if (!alreadyExists) {
        // Add to live state only if it doesn't exist in API data
        setLiveNotifications((prev) => [data, ...prev]);

        // Show toast
        setToast(data);
        setTimeout(() => setToast(null), 5000);
      }

      // Always refresh API data to get the latest state
      refetchNotifications();
      refetchUnreadCount();
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, token, refetchNotifications, refetchUnreadCount, notifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter out live notifications that already exist in API data
  const uniqueLiveNotifications = liveNotifications.filter(
    (liveNotif) =>
      !notifications.some((apiNotif) => apiNotif.id === liveNotif.id)
  );

  // Combine notifications, ensuring no duplicates
  const allNotifications = [...uniqueLiveNotifications, ...notifications];

  const handleNotificationClick = async (notification: AppNotification) => {
    try {
      if (!notification.isRead) {
        await markAsRead({ id: notification.id }).unwrap();
      }
      refetchUnreadCount();
      refetchNotifications();
      handleNotificationAction(notification);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleNotificationAction = (notification: AppNotification) => {
    switch (notification.type) {
      case "task_assigned":
        console.log("Go to task", notification.entityId);
        break;
      case "project_update":
        console.log("Go to project", notification.entityId);
        break;
      case "sprint_started":
        console.log("Go to sprint", notification.entityId);
        break;
      default:
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllAsRead({ userId }).unwrap();
      refetchUnreadCount();
      refetchNotifications();

      setLiveNotifications([]);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (
    notificationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await deleteNotification({ id: notificationId }).unwrap();

      setLiveNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );
      refetchUnreadCount();
      refetchNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!userId) return;
    try {
      await deleteAllNotifications({ userId }).unwrap();

      setLiveNotifications([]);
      refetchUnreadCount();
      refetchNotifications();
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "error":
        return <FaExclamationCircle className="text-red-400" />;
      case "warning":
        return <FaExclamationTriangle className="text-yellow-400" />;
      case "success":
        return <FaCheckCircle className="text-green-400" />;
      case "task_assigned":
        return <span className="text-blue-400">📋</span>;
      case "project_update":
        return <span className="text-purple-400">📂</span>;
      case "sprint_started":
        return <span className="text-indigo-400">🚀</span>;
      default:
        return <FaInfoCircle className="text-blue-400" />;
    }
  };

  const getToastStyles = (type: string) => {
    switch (type) {
      case "error":
        return "bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-800";
      case "warning":
        return "bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-200 text-amber-800";
      case "success":
        return "bg-gradient-to-r from-green-50 to-emerald-100 border-green-200 text-green-800";
      case "task_assigned":
        return "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-800";
      case "project_update":
        return "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 text-purple-800";
      case "sprint_started":
        return "bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-800";
      default:
        return "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 text-slate-800";
    }
  };

  const getToastIconColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-600";
      case "warning":
        return "text-amber-600";
      case "success":
        return "text-green-600";
      case "task_assigned":
        return "text-blue-600";
      case "project_update":
        return "text-purple-600";
      case "sprint_started":
        return "text-indigo-600";
      default:
        return "text-slate-600";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "À l'instant";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return `Il y a ${Math.floor(diffInHours / 24)}j`;
  };

  const dismissToast = () => {
    setToast(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 group"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            refetchNotifications();
            refetchUnreadCount();
          }
        }}
      >
        <FaBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-slate-800 rounded-2xl shadow-2xl border border-slate-600 z-50 max-h-[28rem] overflow-hidden">
          <div className="p-5 border-b border-slate-600 flex justify-between items-center bg-slate-700">
            <h3 className="font-bold text-white text-lg">Notifications</h3>
            <div className="flex space-x-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-2 text-slate-300 hover:text-blue-300 hover:bg-blue-500 rounded-xl transition-all duration-200"
                  title="Tout marquer comme lu"
                >
                  <FaCheckDouble className="h-4 w-4" />
                </button>
              )}
              {allNotifications.length > 0 && (
                <button
                  onClick={handleDeleteAllNotifications}
                  className="p-2 text-slate-300 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-200"
                  title="Effacer toutes"
                >
                  <FaTrash className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto max-h-80 bg-slate-800">
            {allNotifications.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                Aucune notification
              </div>
            ) : (
              <div className="divide-y divide-slate-600">
                {allNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-5 hover:bg-slate-700 cursor-pointer ${
                      !n.isRead
                        ? "bg-slate-750 border-l-4 border-l-blue-400"
                        : "bg-slate-800"
                    }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className="mt-0.5 p-3 bg-slate-700 rounded-xl">
                          {getNotificationIcon(n.type)}
                        </div>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              !n.isRead ? "text-white" : "text-slate-100"
                            }`}
                          >
                            {n.message}
                          </p>
                          <span className="text-xs text-slate-400">
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteNotification(n.id, e)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-200"
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div
            className={`
              ${getToastStyles(toast.type)}
              min-w-[320px] max-w-[400px] 
              rounded-2xl border-2 
              shadow-2xl backdrop-blur-sm
              transform transition-all duration-300 ease-out
              hover:scale-[1.02] hover:shadow-xl
              animate-slide-in-right
            `}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-xl bg-white/20 ${getToastIconColor(
                    toast.type
                  )}`}
                >
                  {getNotificationIcon(toast.type)}
                </div>
                <span className="font-semibold text-sm">
                  Nouvelle notification
                </span>
              </div>
              <button
                onClick={dismissToast}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors duration-200 opacity-70 hover:opacity-100"
              >
                <FaTimes className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Notification content */}
            <div className="px-4 pb-4">
              <p className="text-sm font-medium leading-5 mb-2">
                {toast.message}
              </p>
              <div className="flex items-center justify-between text-xs opacity-80">
                <span>{formatDate(toast.createdAt)}</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse"></div>
                  <span>En direct</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/20 rounded-b-2xl overflow-hidden">
              <div className="h-full bg-current opacity-60 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
