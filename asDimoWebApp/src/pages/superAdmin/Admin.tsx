// import AdminList from "../../components/modules/AdminList";
import ZonalAdminList from "../../components/modules/GlobalTableList";
import { Heading1 } from "../../components/ui/HeadingPara";
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";

const SupAdmin: React.FC = () => {
  const role = getCurrentUserRole();
  const filterByZonalAdminId = role === "zonalAdmin";

  return (
    <>
      <Heading1 text="Admin List" />
      {/* <AdminList /> */}
      <ZonalAdminList
        flag={7}
        columns={[
          { key: "name", title: "Name", sortable: true },
          { key: "zonal_admin_name", title: "Zonal Admin Name", sortable: true },
          { key: "organizations", title: "Organizations", sortable: true },
          { key: "location", title: "Location" },
          { key: "subscription", title: "Subscription", sortable: true },
          { key: "pe", title: "PE", sortable: true },
        ]}
        filterByZonalAdminId={filterByZonalAdminId}
      />
    </>
  );
};

export default SupAdmin;