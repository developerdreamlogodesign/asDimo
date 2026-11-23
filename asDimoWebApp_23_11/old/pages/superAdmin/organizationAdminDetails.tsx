import { Heading1 } from "../../components/ui/HeadingPara";
import ViewProfileDetails from "../../components/modules/ViewProfileDetails";
import { useLocation, useSearchParams } from "react-router-dom";

const SupORGadminDetails: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const stateUserId = (location.state as any)?.userId;
  const queryUserId = searchParams.get("userId");

  const userId = stateUserId || (queryUserId ? Number(queryUserId) : undefined);

  return (
    <>
      <Heading1 text="Organizations Profile" />
      <ViewProfileDetails userId={userId} />
    </>
  );
};

export default SupORGadminDetails;