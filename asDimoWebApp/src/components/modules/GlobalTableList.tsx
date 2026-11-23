import React, { useEffect, useState } from "react";
import Table from "../ui/Table";
import DashboardButtons from "../ui/Buttons";
import IButton from "../../assets/Images/iButton.svg";
import Loader from "../ui/Loaders";
import { authService } from "../../services/authService";
import { tokenManager } from "../../services/tokenManager";
import ModalBox from "../ui/ModalBox";
import SearchWithSort from "../ui/SearchWithSort";
import { useLocation, useNavigate } from "react-router-dom";
import  { routes } from "../../routes/AppRoutes";
// import PlusIcon from "../../assets/Images/PlusIcon.svg";
import {XIcon} from 'lucide-animated';
import { filebasename } from "../../api/config";


interface ColumnConfig {
  key: string;
  title: string;
  sortable?: boolean;
  fixed?: boolean;
}

interface ZonalAdminListProps {
  flag: number | number[];
  columns: ColumnConfig[];
  filteredUserId?: string; // For filtering data by current user (teachersGlobal)
  filterByZonalAdminId?: boolean;
  showDoctorsTabs?: boolean; // For filtering admins by zonalAdminId (flag 7)
  showSearch?: boolean;
  showAddButton?: boolean;
  showPagination?: boolean;
  showChooseColumns?: boolean;
  onViewAll?: () => void;
  limit?: number;
  selectable?: boolean;
  showSort?: boolean;
}

const TableAvatar: React.FC<{ src?: string; name?: string }> = ({ src, name }) => {
  const [imgError, setImgError] = React.useState(false);
  const initial =
    name && name !== "N/A" && name !== "-"
      ? name.trim().charAt(0).toUpperCase()
      : "U";

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || ""}
        className="doctor-image"
        onError={() => setImgError(true)}
      />
    );
  }

  return <div className="doctor-image-initial">{initial}</div>;
};

const getProfileImage = (user: any): string | undefined => {
  if (!user) return undefined;
  const image =
    user.profileImg ||
    user.googleProfile?.picture ||
    user.facebookProfile?.picture ||
    null;

  if (!image) return undefined;
  if (typeof image === "string" && (image.startsWith("http://") || image.startsWith("https://"))) {
    return image;
  }
  return `${filebasename}${image.startsWith("/") ? "" : "/"}${image}`;
};

const getRelatedCount = (item: any, key: string) =>
  item.relatedData?.[key]?.count ??
  item.relatedData?.[key]?.data?.length ??
  0;

const sortRows = (
  rows: any[],
  sortBy: string,
  sortOrder: "asc" | "desc"
) => {
  return [...rows].sort((firstRow, secondRow) => {
    if (sortBy === "created" || sortBy === "createdAt") {
      const firstTime = new Date(
        firstRow.originalData?.createdAt ?? firstRow.createdAt ?? 0
      ).getTime();
      const secondTime = new Date(
        secondRow.originalData?.createdAt ?? secondRow.createdAt ?? 0
      ).getTime();

      return sortOrder === "desc"
        ? secondTime - firstTime
        : firstTime - secondTime;
    }

    const firstValue = firstRow[sortBy] ?? "";
    const secondValue = secondRow[sortBy] ?? "";

    if (
      typeof firstValue === "number" &&
      typeof secondValue === "number"
    ) {
      return sortOrder === "desc"
        ? firstValue - secondValue
        : secondValue - firstValue;
    }

    const comparison = String(firstValue).localeCompare(
      String(secondValue),
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    );

    return sortOrder === "asc" ? comparison : -comparison;
  });
};

const sortFieldMap: Record<string, string> = {
  name: "name",
  admin: "relatedData.admins.count",
  organizations: "relatedData.organizations.count",
  pe: "relatedData.teachers.count",
  location: "roleData.city",
  subscription: "subscription",
  zonal_admin_name: "relatedData.zonalAdmin.name",
  admin_name: "relatedData.Admin.name",
  organization_name: "relatedData.organizations.name",
  parent_name: "name",
  children_details: "relatedData.parents.count",
  parent_count: "relatedData.parents.count",
  therapists: "relatedData.teachers.count",
  created: "createdAt",
  createdAt: "createdAt",
  email: "email",
};

const GlobalTableList: React.FC<ZonalAdminListProps> = ({
  flag,
  columns: dynamicColumns,
  filteredUserId,
  filterByZonalAdminId,
  showDoctorsTabs = false,
  showSearch = true,
  showAddButton = true,
  showPagination = true,
  showChooseColumns = true,
  onViewAll,
  limit,
  selectable = true,
  showSort = true,
}) => {
  const navigate = useNavigate();
  const flags = Array.isArray(flag) ? flag : [flag];
  const primaryFlag = flags[0];
  const flagDependency = flags.join(",");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState("createdAt");
  // null means no tab is selected, so both therapist types are shown.
  const [activeDoctorFlag, setActiveDoctorFlag] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const location = useLocation();
  const currentRole = location.pathname.split("/")[1];
  
  // Get current user for hierarchical filtering
  const currentUser = tokenManager.getUser();
  /**
   * Determine filter field based on logged-in user's flag
   * Flag 6: Zonal Admin - filter all data by zonalAdminId
   * Flag 7: Admin - filter all data by adminId
   * Flag 1: Organization Admin - filter all data by organizationAdminId
   * Flag 3: Teacher - filter all data by teacherId
   */
  const getFilterFieldByLoginFlag = (): { field: string | null; value: string | number | null } => {
    if (!currentUser?.flag) return { field: null, value: null };

    const userIdValue = currentUser.userId || currentUser.id;
    
    switch (currentUser.flag) {
      case 6: // Zonal Admin
        return { field: "roleData.zonalAdminId", value: userIdValue };
      case 7: // Admin
        return { field: "roleData.adminId", value: userIdValue };
      case 1: // Organization Admin
        return { field: "roleData.organizationAdminId", value: userIdValue };
      case 3: // Teacher
      case 5: // Teacher (Global)
        return { field: "roleData.teacherId", value: userIdValue };
      default:
        return { field: null, value: null };
    }
  };


  const handleSort = (key: string) => {
    setCurrentPage(1);

    setSort((prevSort) =>
      sortBy === key && prevSort === "desc" ? "asc" : "desc"
    );

    setSortBy(key);
  };

  const handleViewDetails = (row: any) => {
    const { userId, flag } = row.originalData;
    // console.log("...........currentRole.............",currentRole);


    if (flag === 6) {
      navigate(routes.SUP_ZONALADMIN_DETAILS, {
        state: { userId , flag },
      });
    } else if (flag === 7) {
      if(currentRole == "superadmin"){
        navigate(routes.SUP_ADMIN_DETAILS, {
          state: { userId , flag },
        });
      }else{
        navigate(routes.ZONAL_ADMIN_DETAILS, {
          state: { userId , flag },
        });
      }

    } else if (flag === 1) {
      if(currentRole == "zonaladmin"){
        navigate(routes.ZONAL_ORGANIZATION_DETAILS, {
          state: { userId , flag },
        });
      }else if(currentRole == "admin"){
        navigate(routes.ADMIN_ORGANIZATION_DETAILS, {
          state: { userId , flag },
        });
      }else{
        navigate(routes.SUP_ORGANIZATION_DETAILS, {
          state: { userId , flag },
        });
      }

    } else if (flag === 3 || flag === 5) {
      if(currentRole == "zonaladmin"){
        navigate(routes.ZONAL_THERAPIST_DETAILS, {
          state: { userId , flag },
        });
      }else if(currentRole == "admin"){
        navigate(routes.ADMIN_THERAPIST_DETAILS, {
          state: { userId , flag },
        });
      }else if(currentRole == "organizationadmin"){
        navigate(routes.ORGANIZATIONADMIN_THERAPIST_DETAILS, {
          state: { userId , flag },
        });
      }else{
        navigate(routes.SUP_THERAPIST_DETAILS, {
          state: { userId , flag },
        });
      }

    } else if(flag === 2 || flag === 4){
      if(currentRole == "zonaladmin"){
        navigate(routes.ZONAL_USER_DETAILS, {
          state: { userId , flag },
        });
      }else if(currentRole == "admin"){
        navigate(routes.ADMIN_USER_DETAILS, {
          state: { userId , flag },
        });
      }else if(currentRole == "organizationadmin"){
        navigate(routes.ORGANIZATIONADMIN_USER_DETAILS, {
          state: { userId , flag },
        });
      }else if(currentRole == "therapist"){
        navigate(routes.THERAPIST_USER_DETAILS, {
          state: { userId , flag },
        });
      }else{
        navigate(routes.SUP_USER_DETAILS, {
          state: { userId , flag },
        });
      }
    }
  };


  const columnRenderMap: Record<string, any> = {
    name: {
      key: "name",
      title: "Name",
      fixed: true,
      onFilterClick: handleSort,
      render: (value: string, row: any) => (
        <div className="doctor-info">
          <TableAvatar
            src={row.parentImage || undefined}
            name={value || row.name}
          />
          <h5>{value || row.name || "-"}</h5>
        </div>
      ),
    },
    admin: {
      key: "admin",
      title: "Admin",
      onFilterClick: handleSort,
    },
    organizations: {
      key: "organizations",
      title: "Organizations",
      onFilterClick: handleSort,
    },
    location: {
      key: "location",
      title: "Location",
    },
    parent_name: {
      key: "parent_name",
      title: "User",
      fixed: true,
      render: (value: string, row: any) => (
        <div className="doctor-info">
          <TableAvatar
            src={row.parentImage || undefined}
            name={value || row.parent_name}
          />
          <h5>{value || row.parent_name || "-"}</h5>
        </div>
      ),
    },
    subscription: {
      key: "subscription",
      title: "Subscription",
      onFilterClick: handleSort,
    },
    pe: {
      key: "pe",
      title: "PE",
      onFilterClick: handleSort,
    },
  };

// const [selectedUsers, setSelectedUsers] = useState([]);


  const fetchUsers = async () => {
    try {
      setLoading(true);

      const accessToken = localStorage.getItem("token");

      if (!accessToken) {
        throw new Error("No access token found");
      }

      const flagsToFetch = activeDoctorFlag === null ? flags : [activeDoctorFlag];
      const responses = await Promise.all(
        flagsToFetch.map((currentFlag) =>
          authService.getUsersByFlag(
            accessToken,
            currentFlag,
            {
              search: search.trim(),
              sort,
              sortBy: sortFieldMap[sortBy] ?? sortBy,
              sortOrder: sort,
            }
          )
        )
      );
      let users = responses.flatMap((response) => response.data || []);

      // Apply hierarchical filtering based on logged-in user's flag
      const { field, value } = getFilterFieldByLoginFlag();
      if (field && value) {
        users = users.filter((item: any) => {
          if (field === "roleData.zonalAdminId") {
            return String(item.roleData?.zonalAdminId) === String(value);
          }
          if (field === "roleData.adminId") {
            return String(item.roleData?.adminId) === String(value);
          }
          if (field === "roleData.organizationAdminId") {
            return String(item.roleData?.organizationAdminId) === String(value);
          }
          if (field === "roleData.teacherId") {
            const itemTeacherId =
              item.relatedData?.teacher?.teacherId ??
              item.relatedData?.teacher?.userId ??
              item.relatedData?.teacher?.userData?.userId ??
              item.roleData?.teacherId ??
              item.roleData?.therapistId;
            return (
              String(itemTeacherId) === String(value) ||
              String(item.userId) === String(value)
            );
          }
          return true;
        });
      }

      // Filter by filteredUserId if provided (for teachersGlobal users)
      if (filteredUserId) {
        users = users.filter((item: any) => {
          // Check if item itself is the user (e.g. in therapist list)
          if (
            String(item.userId) === String(filteredUserId) ||
            String(item._id) === String(filteredUserId)
          ) {
            return true;
          }

          // Check if relatedData teacher or roleData teacher/therapist matches filteredUserId
          const relatedTeacher = item.relatedData?.teacher;
          if (
            String(relatedTeacher?.teacherId) === String(filteredUserId) ||
            String(relatedTeacher?.userId) === String(filteredUserId) ||
            String(relatedTeacher?.userData?.userId) === String(filteredUserId) ||
            String(item.roleData?.teacherId) === String(filteredUserId) ||
            String(item.roleData?.therapistId) === String(filteredUserId)
          ) {
            return true;
          }

          // Check if relatedData.teachers array contains the user
          const relatedTeachers = item.relatedData?.teachers?.data || [];
          if (Array.isArray(relatedTeachers)) {
            const isRelated = relatedTeachers.some((teacher: any) =>
              String(teacher.userId) === String(filteredUserId) ||
              String(teacher.teacherId) === String(filteredUserId) ||
              String(teacher._id) === String(filteredUserId)
            );
            if (isRelated) return true;
          }

          return false;
        });
      }

      // Filter by zonalAdminId if provided (for admin list under zonal admin)
      if (filterByZonalAdminId && currentUser?.userId) {
        users = users.filter((item: any) => 
          String(item.roleData?.zonalAdminId) === String(currentUser.userId)
        );
      }

    // console.log("API Response:", users);

    const formattedRows = users.map((item: any) => {
      const parentId = Number(item.roleData?.parentId ?? item.userId);
      const teacherId = Number(item.relatedData?.teacher?.teacherId ?? item.roleData?.teacherId);

      // Therapist name
      const therapistName =
        item.relatedData?.teacher?.userData?.name ??
        item.relatedData?.teacher?.name ??
        "-";

      // Find appointments belonging to this parent + therapist
      const matchedAppointments =
        item.relatedData?.appointments?.data?.filter(
          (appointment: any) =>
            Number(appointment.parentId) === parentId &&
            Number(appointment.teacherId) === teacherId
        ) ?? [];

      // Get latest appointment
      const latestAppointment = matchedAppointments.reduce(
        (latest: any, appointment: any) => {
          if (!latest) return appointment;

          const latestDate = new Date(
            latest.date.split("-").reverse().join("-")
          );

          const currentDate = new Date(
            appointment.date.split("-").reverse().join("-")
          );

          return currentDate > latestDate ? appointment : latest;
        },
        null
      );

      return {
        id: item._id,
        userId: item.userId,
        parentImage: getProfileImage(item),

        name: item.name ?? "-",
        email: item.email,

        zonal_admin_name:
          item.relatedData?.zonalAdmin?.userData?.name ??
          item.relatedData?.zonalAdmin?.userDataname ??
          "Global",

        admin_name:
          item.relatedData?.Admin?.userData?.name ??
          item.relatedData?.admin?.userData?.name ??
          "Global",

        organization_name:
          item.relatedData?.organizations?.userData?.name ??
          item.relatedData?.organization?.userData?.name ??
          item.org_name ??
          "Global",

        parent_name:
          item.name ?? "-",

        children_details:
          item.relatedData?.children?.data
            ?.filter(
              (child: any) =>
                Number(child.parentId) === parentId
            )
            ?.map((child: any) => child.childName)
            ?.filter(Boolean)
            ?.join(", ") || "No Child",

        // Therapist name
        therapist_name: therapistName,

        // Latest appointment date
        last_appointment:
          latestAppointment?.date ?? "No Appointment",

        created:
          new Date(item.createdAt).toLocaleDateString(),

        parent_count:
          getRelatedCount(item, "parents"),

        therapists:
          getRelatedCount(item, "teachers"),

        admin:
          getRelatedCount(item, "admins"),

        organizations:
          getRelatedCount(item, "organizations"),

        location:
          [
            item.roleData?.city ?? item.city,
            item.roleData?.state ?? item.state,
          ]
            .filter(Boolean)
            .join(", ") || "-",

        subscription: "-",

        pe:
          getRelatedCount(item, "teachers"),

        originalData: item,
      };
    });

      setRows(sortRows(formattedRows, sortBy, sort));
    } catch (error) {
      console.error("Error fetching users:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchUsers();
    }, search.trim() ? 400 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [search, sort, sortBy, flagDependency, activeDoctorFlag, filteredUserId, filterByZonalAdminId]);

  const handleDeleteSelected = (selectedRows: any[]) => {
    const userIds = selectedRows.map((row) => row.id);

    setSelectedUserIds(userIds);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      const accessToken = localStorage.getItem("token");

      if (!accessToken) {
        throw new Error("No access token found");
      }

      await authService.deleteUsers(accessToken, selectedUserIds);

      setRows((prevRows) =>
        prevRows.filter(
          (row) => !selectedUserIds.includes(row.id)
        )
      );

      setShowModal(false);
      setSelectedUserIds([]);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete users");
      setShowModal(false);
    }
  };

  const tableColumns = dynamicColumns.map((column) => {
    const mapped = columnRenderMap[column.key];
    return {
      ...(mapped || {
        key: column.key,
        title: column.title,
      }),
      title: column.title,
      fixed: column.fixed ?? mapped?.fixed,
      showFilter: showSort ? (column.sortable ?? (mapped?.onFilterClick ? true : false)) : false,
      onFilterClick: mapped?.onFilterClick ?? (column.sortable ? handleSort : undefined),
      render: (column as any).render || mapped?.render,
    };
  });

  tableColumns.push({
    key: "actions",
    title: "Actions",
    fixed: true,
    render: (_value: any, row: any) => (
      <DashboardButtons
        text="View Details"
        icon={<img src={IButton} alt="view" className="btn-icon" />}
        variant="trashparent"
        onClick={() => handleViewDetails(row)}
      />
    ),
  });

  if (loading) {
    return <Loader fullScreen />;
  }

  const getAddButtonText = (flag: number) => {
    switch (flag) {
      case 6:
        return "Add New Zonal Admin";

      case 7:
        return "Add New Admin";

      case 1:
        return "Add New Organization Admin";

      case 3:
        return "Add New Therapist";

      case 2:
        return "Add New Parent";

      default:
        return "Add New User";
    }
  };

  const handleAddInformation = () => {
      let route = routes.SUP_ADDINFORMATION;

      switch (currentRole) {
        case "superadmin":
          route = routes.SUP_ADDINFORMATION;
          break;

        case "zonaladmin":
          route = routes.ZONAL_ADDINFORMATION;
          break;

        case "admin":
          route = routes.ADMIN_ADDINFORMATION;
          break;

        case "organizationadmin":
          route = routes.ORGANIZATIONADMIN_ADDINFORMATION;
          break;

        case "therapist":
          route = routes.THERAPIST_ADDINFORMATION;
          break;

        default:
          route = routes.SUP_ADDINFORMATION;
      }

    navigate(route, {
      state: { flag: primaryFlag },
    });
  };

  return (
    <div>
      {(showSearch || showAddButton) && (
        <div className="d-flex TableSearchWrap">
          {showSearch && (
            <SearchWithSort
              searchValue={search}
              onSearchChange={setSearch}
              sortValue={sort}
              onSortChange={(value) => {
                if (value === "asc" || value === "desc") {
                  setSort(value);
                }
              }}
            />
          )}
          {showAddButton && (
            <div className="AddUpdateButton">
              <DashboardButtons
                variant="neon"
                textsize="sm"
                icon={<XIcon className="PlusIcon" size={20}/>}
                text={getAddButtonText(primaryFlag)}
                onClick={handleAddInformation}
              />
            </div>
          )}
        </div>
      )}
             
        {showDoctorsTabs && (
          <div className="d-flex DoctorsTabs">
            <DashboardButtons
              text="Under Organizations"
              variant={activeDoctorFlag === 3 ? "SolidYellow" : "SolidNeon"}
              textsize="sm"
              onClick={() => {
                setActiveDoctorFlag((currentFlag) => currentFlag === 3 ? null : 3);
                setCurrentPage(1);
              }}
            />

            <DashboardButtons
              text="Global"
              variant={activeDoctorFlag === 5 ? "SolidYellow" : "SolidNeon"}
              textsize="sm"
              onClick={() => {
                setActiveDoctorFlag((currentFlag) => currentFlag === 5 ? null : 5);
                setCurrentPage(1);
              }}
            />
          </div>
        )}

      <Table
        columns={tableColumns}
        rows={limit ? rows.slice(0, limit) : rows}
        selectable={selectable}
        onBulkDelete={selectable}
        onDeleteSelected={handleDeleteSelected}
        pagination={showPagination}
        currentPage={currentPage}
        totalPages={Math.ceil((limit ? rows.slice(0, limit) : rows).length / rowsPerPage) || 1}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={setRowsPerPage}
        sortBy={sortBy}
        sortOrder={sort}
        showChooseColumns={showChooseColumns}
        onViewAll={onViewAll}
      />

      {showModal && (
        <ModalBox
          header="Confirm Delete"
          onCancel={() => {
            setShowModal(false);
            setSelectedUserIds([]);
          }}
          body={
            <div style={{ textAlign: "center" }}>
              <p>
                Are you sure you want to delete{" "}
                {selectedUserIds.length === 1
                  ? "this user?"
                  : `${selectedUserIds.length} users?`}
              </p>

              <div className="logout-popup-actions d-flex">
                <DashboardButtons
                  text="Cancel"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedUserIds([]);
                  }}
                />

                <DashboardButtons
                  text="Delete"
                  onClick={confirmDelete}
                />
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};

export default GlobalTableList;
