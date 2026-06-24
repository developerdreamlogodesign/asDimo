import { Heading1 } from "../../components/ui/HeadingPara";
import ViewProfileDetails from "../../components/modules/ViewProfileDetails";
import { useLocation, useSearchParams } from "react-router-dom";

const SupAdminDetails: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const stateUserId = (location.state as any)?.userId;
  const queryUserId = searchParams.get("userId");

  const userId = stateUserId || (queryUserId ? Number(queryUserId) : undefined);
//   const stateFlag = (location.state as any)?.flag;

  return (
    <>
      <Heading1 text="Admin Profile Details" />
      <ViewProfileDetails userId={userId} />
      {/* <ViewProfileDetails userId={userId} flag={stateFlag} /> */}
    </>
  );
};

export default SupAdminDetails;