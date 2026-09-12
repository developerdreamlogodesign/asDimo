import GlobalTableList from "../../components/modules/GlobalTableList";
import { Heading1 } from "../../components/ui/HeadingPara";

const SupZonaladmin: React.FC = () => {

  return (
    <>
      <Heading1 text="Zonal Admin" />
      {/* <ZonalAdminList /> */}
      <GlobalTableList
        flag={6}
        columns={[
          { key: "name", title: "Name", sortable: true },
          { key: "admin", title: "Admin", sortable: true },
          { key: "organizations", title: "Organizations", sortable: true },
          { key: "location", title: "Location" },
          { key: "subscription", title: "Subscription", sortable: true },
          { key: "pe", title: "PE", sortable: true },
        ]}
      />
    </>
  );
};

export default SupZonaladmin;