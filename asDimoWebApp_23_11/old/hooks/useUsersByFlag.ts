import { useEffect, useState } from "react";
import { authService } from "../services/authService";

export type SortOrder = "asc" | "desc";

export interface UserTableRow {
  id: string;
  userId: number;
  name: string;
  email: string;
  zonal_admin_name: string;
  admin_name: string;
  organization_name: string;
  parent_name: string;
  children_details: number;
  created: string;
  parent_count: number;
  therapists: number;
  admin: number;
  organizations: number;
  location: string;
  subscription: string;
  pe: number;
  originalData: any;
}

const getRelatedCount = (item: any, key: string) =>
  item.relatedData?.[key]?.count ??
  item.relatedData?.[key]?.data?.length ??
  0;

const sortRows = (
  rows: UserTableRow[],
  sortBy: string,
  sortOrder: SortOrder
) => {
  return [...rows].sort((firstRow, secondRow) => {
    const firstValue = firstRow[sortBy as keyof UserTableRow] ?? "";
    const secondValue = secondRow[sortBy as keyof UserTableRow] ?? "";

    if (
      typeof firstValue === "number" &&
      typeof secondValue === "number"
    ) {
      return sortOrder === "asc"
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
  email: "email",
};

const formatUserRows = (data: any[]): UserTableRow[] =>
  data.map((item: any) => ({
    id: item._id,
    userId: item.userId,
    name: item.name,
    email: item.email,
    zonal_admin_name: item.relatedData?.zonalAdmin?.name ?? "-",
    admin_name: item.relatedData?.Admin?.name ?? "-",
    organization_name: item.relatedData?.organizations?.name ?? "-",
    parent_name: item.name ?? "-",
    children_details: getRelatedCount(item, "parents"),
    created: new Date(item.createdAt).toLocaleDateString(),
    parent_count: getRelatedCount(item, "parents"),
    therapists: getRelatedCount(item, "teachers"),
    admin: getRelatedCount(item, "admins"),
    organizations: getRelatedCount(item, "organizations"),
    location:
      [item.roleData?.city ?? item.city, item.roleData?.state ?? item.state]
        .filter(Boolean)
        .join(", ") || "-",
    subscription: "-",
    pe: getRelatedCount(item, "teachers"),
    originalData: item,
  }));

export const useUsersByFlag = (flag: number) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("asc");
  const [sortBy, setSortBy] = useState("name");
  const [rows, setRows] = useState<UserTableRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const accessToken = localStorage.getItem("token");

      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await authService.getUsersByFlag(accessToken, flag, {
        search: search.trim(),
        sort,
        sortBy: sortFieldMap[sortBy] ?? sortBy,
        sortOrder: sort,
      });

      setRows(sortRows(formatUserRows(response.data), sortBy, sort));
    } catch (error) {
      console.error("Error fetching users:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteUsers = async (userIds: string[]) => {
    try {
      const accessToken = localStorage.getItem("token");

      if (!accessToken) {
        throw new Error("No access token found");
      }

      await authService.deleteUsers(accessToken, userIds);

      setRows((prevRows) =>
        prevRows.filter((row) => !userIds.includes(row.id))
      );
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete users");
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchUsers();
    }, search.trim() ? 400 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [search, sort, sortBy, flag]);

  return {
    rows,
    loading,
    search,
    setSearch,
    sort,
    setSort,
    sortBy,
    setSortBy,
    deleteUsers,
  };
};
