import React, { useState, useRef, useEffect } from "react";
import "./layout.css";
import {MenuIcon} from 'lucide-animated';
import { BellIcon } from "lucide-animated";
import { authService } from "../../services/authService";
import { tokenManager } from "../../services/tokenManager";
import { filebasename } from "../../api/config";
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";

interface NavbarProps {
  toggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggle }) => {
  const [showNotification, setShowNotification] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [profileName, setProfileName] = useState("Admin");
  const [profileRole, setProfileRole] = useState("Admin");
  const profileInitial = profileName?.charAt(0)?.toUpperCase() || "A";
  const [profileImg, setProfileImg] = useState("");
  const profileImageUrl = profileImg
  ? `${filebasename}${profileImg}`
  : "";
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const getRoleName = (flag: number) => {
    switch (flag) {
      case 0:
        return "Super Admin";
      case 1:
        return "Organization Admin";
      case 6:
        return "Zonal Admin";
      case 7:
        return "Admin";
      case 5:
        return "Therapist (Global)";
      case 4:
        return "Parent (Global)";
      case 3:
        return "Therapist";
      case 2:
        return "Parent";
      default:
        return "Admin";
    }
  };


// Demo Notifications
  // const notifications = [
  //   { id: 1, title: "New User Registered", time: "2 mins ago", unread: true, },
  //   { id: 2, title: "Payment Received", time: "15 mins ago", unread: true, },
  //   { id: 3, title: "Subscription Expired", time: "1 hour ago", unread: false, },
  // ];



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotification(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const getDisplayName = (profile: any) => {
      const user = profile?.user || profile?.profile || profile;

      return (
        user?.name ||
        user?.Name ||
        user?.fullName ||
        user?.fullname ||
        user?.username ||
        user?.firstName ||
        user?.email ||
        "Admin"
      );
    };

    const loadProfile = async () => {
      const token = tokenManager.getAccessToken();

      if (!token) {
        return;
      }

      try {
        const response = await authService.getProfile(token);

        const userData = response?.data?.user;

        // console.log("Profile API response ----- :", userData.profileImg);

        setProfileName(getDisplayName(response.data));
        setProfileRole(getRoleName(userData?.flag));
        setProfileImg(userData?.profileImg || "");
      } catch (error) {
        const userData = tokenManager.getUser();

        setProfileName(getDisplayName(userData));
        setProfileRole(getRoleName(userData?.flag));
        setProfileImg(userData?.profileImg || "");

        console.error("Profile API failed:", error);
      }
    };

    loadProfile();
  }, []);


  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);

    const diff = Math.floor(
      (now.getTime() - date.getTime()) / 1000
    );

    if (diff < 60) return `${diff}s ago`;

    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;

    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;

    return `${Math.floor(diff / 86400)} days ago`;
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = tokenManager.getAccessToken();

      if (!token) return;

      try {
        setLoadingNotifications(true);

        const response =
          await authService.getNotifications(token);

        let notificationData = response?.data || [];

        // Filter notifications for teachersGlobal users
        const role = getCurrentUserRole();
        const user = tokenManager.getUser();
        
        if (role === "teachersGlobal" && user?.userId) {
          notificationData = notificationData.filter((notification: any) => {
            // Show only notifications related to this teacher/therapist
            return (
              notification.recipientId === user.userId ||
              notification.teacherId === user.userId ||
              notification.userId === user.userId
            );
          });
        }

        setNotifications(notificationData);
      } catch (error) {
        console.error(
          "Failed to load notifications:",
          error
        );
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, []);

  const markNotificationAsRead = async (id: string) => {
    const token = tokenManager.getAccessToken();

    if (!token) return;

    try {
      await authService.markNotificationRead(id, token);

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id
            ? { ...item, read: true }
            : item
        )
      );

      setShowNotification(false);
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  };
  
  return (
    <div className="navbar">
      <div className="menu-toggle" onClick={toggle}>
        <MenuIcon/>
      </div>

      {/* <h3>{profileRole}</h3> */}

      <div className="d-flex ProfilePreview">

        <div className="NotificationWrapper" ref={notificationRef}>
          <button className="NotificationBtn" onClick={() => setShowNotification(!showNotification)} >
            <BellIcon/>
            {/* <span className="NotificationBadge"> {notifications.filter((item) => item.unread).length} </span> */}
            <span className="NotificationBadge">
              {notifications.filter((item) => !item.read).length}
            </span>
          </button>

          {showNotification && (
            <div className="NotificationDropdown">
              <div className="NotificationHeader">
                <h4>Notifications</h4>
              </div>

              <div className="NotificationList">
                {loadingNotifications ? (
                  <div className="NotificationItem">
                    Loading...
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((item) => (
                    // <div
                    //   key={item._id}
                    //   className={`NotificationItem ${
                    //     !item.read ? "unread" : ""
                    //   }`}
                    // >

                      <div
                        key={item._id}
                        className={`NotificationItem ${
                          !item.read ? "unread" : ""
                        }`}
                        onClick={() => {
                          if (!item.read) {
                            markNotificationAsRead(item._id);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                      {!item.read && (
                        <div className="NotificationDot"></div>
                      )}

                      <div>
                        <h5>{item.title}</h5>

                        <p
                          style={{
                            margin: "4px 0",
                            fontSize: "12px",
                          }}
                        >
                          {item.message}
                        </p>

                        <span>
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="NotificationItem">
                    No notifications found
                  </div>
                )}
              </div>


              <div className="NotificationFooter">
                All Notifications
              </div>
            </div>
          )}
        </div>

        

        <div className="ProfileName">
          {profileName}
          <p>{profileRole}</p>
        </div>

      <div className="ProfileIMAGE">
        {profileImg ? (
          // <img src={profileImg} alt={profileName} />
          <img src={profileImageUrl} alt={profileName} />
        ) : (
          profileInitial
        )}
      </div>
      </div>
    </div>
  );
};

export default Navbar;
