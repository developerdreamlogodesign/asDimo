import GlobalTableList from "../../components/modules/GlobalTableList";
import { Heading1 } from "../../components/ui/HeadingPara";

const SupOrganization: React.FC = () => {

  return (
    <>
      <Heading1 text="Organization Admin" />
      {/* <ZonalAdminList /> */}
      <GlobalTableList
        flag={[1, 5]}
        columns={[
          { key: "name", title: "Name", sortable: true },
          { key: "admin_name", title: "Admin", sortable: true },
          { key: "email", title: "Email", sortable: true },
          { key: "therapists", title: "Therapists", sortable: true },
          { key: "subscription", title: "Subscription", sortable: true },
          { key: "pe", title: "PE", sortable: true },
          { key: "location", title: "Location" },
        ]}
      />
    </>
  );
};

export default SupOrganization;