import UserDetail from "../../components/modules/UserDetail";
import { Heading1 } from "../../components/ui/HeadingPara";

const UserDetails: React.FC= ({
}) => {
  return (
    <div className="UserDetailsWrap">
        <Heading1 text="User Profile" />
        <UserDetail/>
    </div>
  );
};

export default UserDetails;