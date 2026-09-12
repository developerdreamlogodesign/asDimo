import GlobalTableList from "../../components/modules/GlobalTableList";
import { Heading1 } from "../../components/ui/HeadingPara";
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";
import { tokenManager } from "../../services/tokenManager";

const SupTherapist: React.FC = () => {
  const role = getCurrentUserRole();
  const user = tokenManager.getUser();
  const filteredUserId = role === "teachersGlobal" ? user?.userId : undefined;
  const isOrganizationAdmin = role === "OrganizationAdmin";

  return (
    <>
      <Heading1 text="Doctors / Therapists LIST" />
      <GlobalTableList
        flag={[3,5]}
        {...(!isOrganizationAdmin && { showDoctorsTabs: true })}
        columns={[
          { key: "name", title: "Dr. Name", sortable: true},
        ...(!isOrganizationAdmin
            ?[ { key: "admin_name", title: "Admin", sortable: true, },]
            : []),
          { key: "organization_name", title: "Organization", sortable: true },
          { key: "parent_count", title: "User", sortable: true },
          { key: "subscription", title: "Subscription", sortable: true },
          { key: "location", title: "Location" },
        ]}
        filteredUserId={filteredUserId}
      />
    </>
  );
};

export default SupTherapist;
