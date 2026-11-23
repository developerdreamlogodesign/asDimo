import GlobalTableList from "../../components/modules/GlobalTableList";
import { Heading1 } from "../../components/ui/HeadingPara";

const SupParent: React.FC = () => {

  return (
    <>
      <Heading1 text="Parent Admin" />
      {/* <ZonalAdminList /> */}
      <GlobalTableList
        // flag={2}
        flag={[2, 4]}
        columns={[
          { key: "parent_name", title: "Users", sortable: true },
          { key: "children_details", title: "Children Details", sortable: true },
          { key: "admin_name", title: "Admin", sortable: true },
          { key: "organization_name", title: "Organization", sortable: true },
          { key: "location", title: "Location" },
        //   { key: "email", title: "Email", sortable: true },
          { key: "subscription", title: "Subscription", sortable: true },
          { key: "created", title: "Created", sortable: true },
        ]}
      />
    </>
  );
};

export default SupParent;