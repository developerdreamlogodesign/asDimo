import GlobalTableList from "../../components/modules/GlobalTableList";
import { Heading1 } from "../../components/ui/HeadingPara";
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";
import { tokenManager } from "../../services/tokenManager";

const SupParent: React.FC = () => {
  const role = getCurrentUserRole();
  const user = tokenManager.getUser();
  const filteredUserId = role === "teachersGlobal" ? user?.userId : undefined;

  // console.log("....................", role);

  return (
    <>
      <Heading1 text="Parent List" />
      <GlobalTableList
        // flag={2}
        flag={[2, 4]}
        columns={[
          { key: "parent_name", title: "Users", sortable: true, fixed: true},
          { key: "children_details", title: "Children Details", sortable: true },
          ...(role !== "OrganizationAdmin" && role !== "TeachersOrg"
            ? [
            { key: "admin_name", title: "Admin", sortable: true },
          ]
            : []),

          ...(role !== "TeachersOrg"
          ? [
            { key: "organization_name", title: "Organization", sortable: true },
            { key: "therapist_name", title: "Therapist", sortable: true },

          ]
          : []),
          { key: "last_appointment", title: "Last Appointment", sortable: true },
          { key: "location", title: "Location" },
        //   { key: "email", title: "Email", sortable: true },
          { key: "subscription", title: "Subscription", sortable: true },
          { key: "created", title: "Created", sortable: true },
          { key: "pe", title: "PE", sortable: true },
        ]}
        filteredUserId={filteredUserId}
      />
    </>
  );
};

export default SupParent;