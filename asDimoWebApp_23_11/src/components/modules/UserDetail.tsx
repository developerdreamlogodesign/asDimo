import React, { useState, useEffect } from "react";
import "./ModulesStyles.css";
import { Heading4, Heading5, Paragraph, UnorderedList, MiniHeading5, TinyPara } from "../ui/HeadingPara";
import Button from "../ui/Buttons";
import { DeleteIcon, ArrowDownIcon, ArrowUpIcon } from "lucide-animated";
import PhoneIcon from "../../assets/Images/PhoneIcon.svg";
import EmailIcon from "../../assets/Images/MailIcon.svg";
import LocationIcon from "../../assets/Images/MapIconHandle.svg";
import ORGProf from "../../assets/Images/ORGProf.svg";
import ChildrenIcon from "../../assets/Images/ChildrenIcon.svg";
import SubscriptionIcon from "../../assets/Images/SubscriptionIcon.svg";
import AttentionIcon from "../../assets/Images/AttentionIcon.png";
import CommunicationIcon from "../../assets/Images/CommunicationIcon.png";
import PuzzleIcon from "../../assets/Images/PuzzleIcon.png";
import EmotionsIcon from "../../assets/Images/EmotionsIcon.png";
import { authService } from "../../services/authService";
import { tokenManager } from "../../services/tokenManager";
import { filebasename } from "../../api/config";
import Loader from "../ui/Loaders";
import SkillIcon from "../../assets/Images/SkillIcon.svg";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import ImproveIcon from "../../assets/Images/ImproveIcon.svg";
import SteadyIcon from "../../assets/Images/SteadyIcon.svg";
import SMSIcon from "../../assets/Images/SMSIcon.svg";
import InteractionIcon from "../../assets/Images/InteractionIcon.svg";
import BehaviorIcon from "../../assets/Images/BehaviorIcon.svg";
import CognitiveIcon from "../../assets/Images/CognitiveIcon.svg";
import MotorSkillsIcon from "../../assets/Images/MotorSkillsIcon.svg";
import TimingReport from "../ui/graphBar";




interface Props {
  userId?: number | string;
}

interface UserData {
  _id?: string;
  userId?: number;
  name?: string;
  email?: string;
  phone?: string | null;
  flag?: number;
  status?: number;
  profileImg?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  country?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string | null;
  roleData?: {
    _id?: string;
    parentId?: number;
    userId?: number;
    user?: string;
    organizationId?: number;
    organizationAdminId?: number;
    zonalAdminId?: number;
    adminId?: number;
    therapistId?: number;
    teacherId?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  relatedData?: {
    Admin?: {
      _id?: string;
      userId?: number;
      name?: string;
      email?: string;
      phone?: string;
      city?: string;
      state?: string;
      pincode?: string;
      address?: string;
      profileImg?: string | null;
    };
    organizations?: {
      _id?: string;
      userId?: number;
      name?: string;
      email?: string;
      profileImg?: string | null;
      organization_type?: string | null;
      organization_name?: string | null;
      userData?: {
        _id?: string;
        userId?: number;
        name?: string;
        email?: string;
        phone?: string;
        profileImg?: string | null;
        city?: string;
        state?: string;
        pincode?: string;
        address?: string;
      };
    };
    teacher?: {
      _id?: string;
      teacherId?: number;
      userId?: number;
      therapist_category?: string;
      userData?: {
        _id?: string;
        userId?: number;
        name?: string;
        email?: string;
        phone?: string;
        profileImg?: string | null;
      };
    };
    parents?: {
      count?: number;
      data?: any[];
    };
    children?: {
      count?: number;
      data?: Array<{
        _id?: string;
        parentId?: number;
        childName?: string;
        childGender?: string;
        childAge?: number;
        grade?: string;
        familyType?: string;
        language?: string;
        dob?: string;
        childId?: number;
      }>;
    };
    appointments?: {
      count?: number;
      data?: Array<{
        _id?: string;
        parentId?: number;
        teacherId?: number;
        availabilityId?: string;
        date?: string;
        time?: string;
        status?: string;
        zoomLink?: string;
      }>;
    };
  };
}

const timingData = [
  { day: "Mon", value: 52 },
  { day: "Tue", value: 74 },
  { day: "Wed", value: 31 },
  { day: "Thu", value: 20 },
  { day: "Fri", value: 25 },
  { day: "Sat", value: 73 },
  { day: "Sun", value: 28 },
];


const games = [
  { name: "Puzzle", icon: AttentionIcon },
  { name: "Memory", icon: CommunicationIcon },
  { name: "Puzzle", icon: PuzzleIcon },
  { name: "Emotions", icon: EmotionsIcon },
];

const skills = [
  { name: "Communication", icon: SMSIcon, progress: 80, time: "2h 30m", status: "Improving", direction: "+12%", },
  { name: "Social Interaction", icon: InteractionIcon, progress: 65, time: "1h 45m", status: "Steady", direction: "-10%", },
  { name: "Behavior ", icon: BehaviorIcon, progress: 65, time: "1h 45m", status: "Improving", direction: "+10%", },
  { name: "Cognitive", icon: CognitiveIcon, progress: 65, time: "1h 45m", status: "Improving", direction: "+30%", },
  { name: "Motor Skills", icon: MotorSkillsIcon, progress: 65, time: "1h 45m", status: "Steady", direction: "-5%", },
];

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
};

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getImageUrl = (imgPath?: string | null) => {
  if (!imgPath) return null;
  if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
    return imgPath;
  }
  return `${filebasename}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
};

const UserDetail: React.FC<Props> = ({ userId: propUserId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const effectiveUserId =
    propUserId ||
    (location.state as any)?.userId ||
    (location.state as any)?.id ||
    searchParams.get("userId") ||
    searchParams.get("id");

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [adminList, setAdminList] = useState<any[]>([]);
  // const [userFlag, setuserFlag] = useState<any[]>([]);
  const [userFlag, setuserFlag] = useState(0);
  const [selectedAdminId, setSelectedAdminId] = useState<string | number>("");
  const [savingAdmin, setSavingAdmin] = useState<boolean>(false);

  // Fetch User Details
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!effectiveUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = tokenManager.getAccessToken() || localStorage.getItem("token");
        if (!token) {
          console.error("No access token found");
          return;
        }

        const res = await authService.getUserById(token, effectiveUserId);
        const fetchedUser: UserData = res?.data || res;
        setUserData(fetchedUser);

        // console.log("resssss",res?.data?.flag);
        setuserFlag(res?.data?.flag);

        // Set initial assigned admin ID
        const currentAdminId =
          fetchedUser?.roleData?.adminId ||
          fetchedUser?.relatedData?.Admin?.userId ||
          fetchedUser?.relatedData?.Admin?._id ||
          "";
        setSelectedAdminId(currentAdminId);

        // Fetch list of Admins (flag = 7) for dropdown
        try {
          const adminRes = await authService.getUsersByFlag(token, 7);
          if (adminRes?.data) {
            setAdminList(adminRes.data);
          }
        } catch (err) {
          console.error("Failed to load admin list:", err);
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [effectiveUserId]);

  // Handle Delete User
  const handleDeleteUser = async () => {
    const idToDelete = userData?._id || effectiveUserId || userData?.userId;
    if (!idToDelete) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      const token = tokenManager.getAccessToken() || localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      // console.log("...............idToDelete",idToDelete);

      await authService.deleteUsers(token, [String(idToDelete)]);
      alert("User deleted successfully");
      navigate(-1);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  // Handle Save Assigned Admin
  const handleSaveAdmin = async () => {
    if (!selectedAdminId) {
      alert("Please select an Admin");
      return;
    }

    try {
      setSavingAdmin(true);
      const token = tokenManager.getAccessToken() || localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      await authService.updateUserRelation(token, {
        flag: userData?.flag || 2,
        userId: Number(userData?.userId || effectiveUserId),
        updatedUserId: Number(selectedAdminId),
      });

      alert("Assigned Admin updated successfully");
    } catch (error) {
      console.error("Failed to update assigned admin:", error);
      alert("Failed to update assigned admin");
    } finally {
      setSavingAdmin(false);
    }
  };

  if (loading) {
    return <Loader fullScreen={false} />;
  }

  const fullAddress = [
    userData?.address,
    userData?.city,
    userData?.state,
    userData?.pincode,
    userData?.country,
  ]
    .filter(Boolean)
    .join(", ") || "N/A";

  const primaryChild = userData?.relatedData?.children?.data?.[0];
  const organization = userData?.relatedData?.organizations;
  const teacher = userData?.relatedData?.teacher;
  const teacherUserData = teacher?.userData;
  // const latestAppointment = userData?.relatedData?.appointments?.data?.[0];
  const latestAppointment = userData?.relatedData?.appointments?.data?.at(-1);

  const profileImgUrl = getImageUrl(userData?.profileImg);
  const teacherImgUrl = getImageUrl(teacherUserData?.profileImg);

  // console.log("userData..................................",userData);

  return (
    <div className="UserDeatilswrap">
      {/* Top Status & Actions */}
      <div className="UserDeatils d-flex">
        <div className="User_Status">
          <span
            style={{
              background: userData?.status === 1 ? "var(--NeonGreen)" : "#ccc",
            }}
          ></span>
          {userData?.status === 1 ? "Active User" : "Inactive User"}
          <Paragraph
            text={`Last login: ${
              userData?.lastLogin ? formatDate(userData.lastLogin) : "N/A"
            }`}
          />
        </div>
        <div className="Actiom_btn">
          <Button
            text={deleting ? "Deleting..." : "Delete User"}
            textsize="md"
            variant="red"
            icon={<DeleteIcon size={20} />}
            onClick={handleDeleteUser}
            disabled={deleting}
          />
        </div>
      </div>

      <div className="profile-page">
        <div className="dashboard-grid">
          {/* Profile Card */}
          <section className="card profile-card">
            <div className="profile-main">
              <div className="avatar" style={{ overflow: "hidden" }}>
                {profileImgUrl ? (
                  <img
                    src={profileImgUrl}
                    alt={userData?.name || "User Avatar"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  getInitials(userData?.name)
                )}
              </div>

              <div className="profile-info">
                <div className="profile-title-row">
                  <Heading5 text={userData?.name || "User Name"} />
                </div>
                <UnorderedList
                  variant="icon"
                  iconsize={20}
                  items={[
                    {
                      icon: PhoneIcon,
                      text: userData?.phone ? String(userData.phone) : "N/A",
                    },
                    {
                      icon: EmailIcon,
                      text: userData?.email || "N/A",
                    },
                    {
                      icon: LocationIcon,
                      text: fullAddress,
                    },
                  ]}
                />
              </div>
            </div>
          </section>

          {/* Child & Organization / Therapist Details */}
          <section className="card child-card">
            <div className="organization">
              <div className="organization-icon">
                <img src={ORGProf} alt="Organization Profile" />
              </div>
              <div>
                <Heading5 text={organization?.userData?.name || "Organization Name"} />
                <Paragraph
                  text={
                    teacherUserData?.name ||
                    (teacher as any)?.name ||
                    "Therapist Name"
                  }
                />
              </div>
            </div>

            <div className="divider" />

            <Heading4 text="Child details" />
            <div className="child-info">
              <div className="child-avatar">
                <img src={ChildrenIcon} alt="Child Icon" />
              </div>
              <div className="child-name">
                <MiniHeading5 text={primaryChild?.childName || "No child registered"} />
                <TinyPara
                  text={`Age: ${
                    primaryChild?.childAge !== undefined
                      ? primaryChild.childAge
                      : "N/A"
                  }`}
                />
              </div>

              <div className="child-grade">
                <TinyPara
                  text={
                    primaryChild?.grade
                      ? primaryChild.grade.toLowerCase().includes("grade")
                        ? primaryChild.grade
                        : `${primaryChild.grade} Grade`
                      : "N/A"
                  }
                />
              </div>

              <span className="school-badge">
                { "School" }
              </span>
            </div>
          </section>

          {/* Last Buy */}
          <section className="card last-buy-card">
            <div className="card-title-row">
              <Heading5 text="Last-Buy" />
            </div>

            <div className="last-buy-list">
              <Paragraph text="Coming Soon..." />
            </div>
          </section>

          {/* Subscription */}
          <section className="card subscription-card">
            <Heading5 text="Subscription Details" />
            <div className="subscription-content">
              <div className="subscription-icon">
                <img src={SubscriptionIcon} alt="Subscription Icon" />
              </div>

              <div className="subscription-main">
                <Heading4 text="Premium" />
                <Paragraph
                  text={`Start Date: ${
                    userData?.createdAt ? formatDate(userData.createdAt) : "N/A"
                  }`}
                />
                <Paragraph text="Cost: $195/year" />
              </div>

              <div className="subscription-side">
                <Paragraph text="Renewal Date:" />
                <Paragraph text="01/02/2027" />
              </div>
            </div>
          </section>

          {/* Appointment */}
          <section className="card appointment-card">
            <Heading5 text="Appointment Details" />
            <div className="appointment-person">
              <div className="doctor-avatar" style={{ overflow: "hidden" }}>
                {teacherImgUrl ? (
                  <img
                    src={teacherImgUrl}
                    alt={teacherUserData?.name || "Therapist"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  getInitials(teacherUserData?.name || "Therapist")
                )}
              </div>
              <div>
                <Heading4
                  text={
                    teacherUserData?.name ||
                    (teacher as any)?.name ||
                    "Therapist Name"
                  }
                />
                <Paragraph
                  text={
                    latestAppointment
                      ? `${latestAppointment.time || ""} ${
                          latestAppointment.date || ""
                        } (${latestAppointment.status || "Scheduled"})`
                      : "No upcoming appointments"
                  }
                />
              </div>
            </div>
          </section>

          {/* Games */}
          <section className="card games-card">
            <Heading5 text="Games" />

            <div className="games-list">
              {games.map((game, index) => (
                <div className="game-icon" key={index}>
                  <img
                    src={game.icon}
                    alt={game.name || "Game icon"}
                    className="game-icon-image"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Psychological */}
          <section className="card psychological-card">
            <Heading5 text="Psychological Evaluation" />
            <MiniHeading5
              text={
                primaryChild?.childName
                  ? `${primaryChild.childName} Details`
                  : "Child Details"
              }
            />
            <Paragraph
              text={
                teacher?.therapist_category
                  ? `${teacher.therapist_category} Evaluation`
                  : primaryChild?.language
                  ? `${primaryChild.language} (${primaryChild.familyType || ""})`
                  : "General Evaluation"
              }
            />
          </section>
          {/* Assigned Admin */}
          {userFlag === 4 && (
            <section className="card assigned-card">
            <div className="assigned-header">
              <Heading5 text="Assigned to Admin" />
              <button
                onClick={handleSaveAdmin}
                disabled={savingAdmin}
                style={{ cursor: savingAdmin ? "not-allowed" : "pointer" }}
              >
                {savingAdmin ? "Saving..." : "Save"}
              </button>
            </div>
            <MiniHeading5 text="Admin" />
            <select
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
            >
              <option value="">Select Admin</option>
              {adminList.length > 0 ? (
                adminList.map((admin) => (
                  <option
                    key={admin.userId || admin._id}
                    value={admin.userId || admin._id}
                  >
                    {admin.name} ({admin.email})
                  </option>
                ))
              ) : userData?.relatedData?.Admin ? (
                <option
                  value={
                    userData.relatedData.Admin.userId ||
                    userData.relatedData.Admin._id
                  }
                >
                  {userData.relatedData.Admin.name} (
                  {userData.relatedData.Admin.email})
                </option>
              ) : null}
            </select>
          </section>
          )}

          {/* Skills */}
                  <section className="skills-section">
          <div className="skills-header">
            <div className="target-icon"><img src={SkillIcon} /></div>
            <Heading5 text="Skills Practiced"/>
          </div>

          <div className="skills-content">

            <div className="skills-list">
              {skills.map((skill, index) => (
                <div className="skill-row" key={index}>
                  <div className="skill-icon">
                    <img src={skill.icon} alt={skill.name} width={35} height={35} />
                  </div>

                  <strong>{skill.name}</strong>

                  <div className="skill-progress">
                    <div style={{ width: `${skill.progress}%` }} />
                  </div>

                  <span>{skill.time}</span>

                  <div className={`skill-status ${skill.status === "Steady" ? "steady" : ""}`}>
                    <span className="status-face">
                      <img
                        src={skill.status === "Improving" ? ImproveIcon : SteadyIcon}
                        alt={skill.status}
                      />
                    </span>

                    <div className="status">{skill.status}</div>
                      {skill.status === "Improving" ? (
                         <ArrowUpIcon className="ArrowUpIcon"/> ) : ( <ArrowDownIcon className="ArrowDownIcon"/>
                      )}
      
                  </div>
                </div>
              ))}
            </div>

              {/* Timing Report */}
              <div className="timing-report">
                 <TimingReport data={timingData} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;