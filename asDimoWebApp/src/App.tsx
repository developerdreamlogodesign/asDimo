import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthMain from "./pages/auth/authMain";
import AuthMiddleware from "./middleware/AuthMiddleware";

import { routes } from "./routes/AppRoutes";
import { basename } from "./api/config";

import DashboardLayOut from "./components/layout/DashboardLayout";

import SuperAdminDashboard from "./pages/superAdmin/index";


import SupZonaladmin from "./pages/superAdmin/zonalAdmin";
import ZonalAdminDetails from "./pages/superAdmin/ZonalAdminDetails";
import AdminDetails from "./pages/superAdmin/AdminDetails";
import SupOrganization from "./pages/superAdmin/organizationAdmin";
import SupORGadminDetails from "./pages/superAdmin/organizationAdminDetails";
import SupTherapist from "./pages/superAdmin/therapistAdmin";
import SupParent from "./pages/superAdmin/parentAdmin";
import SupAdmin from "./pages/superAdmin/Admin";
import SupAppointment from "./pages/superAdmin/appoinmentList";
import SupTherapistDetails from "./pages/superAdmin/TherapistDetails";
import AddInformation from "./pages/superAdmin/AddInformation";
import SuperAdminSettings from "./pages/superAdmin/Settings";




import ZonalAdminIndex from "./pages/zonalAdmin";

import OrganizationAdminIndex from "./pages/organization";


import AdminIndex from "./pages/Admins/Index"





function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {/* Login */}
        <Route path={routes.LOGIN} element={<AuthMain />} />

        {/* ================= SUPER ADMIN ================= */}

        <Route path={routes.SUPERADMIN} element={
            <AuthMiddleware allowedFlags={["SuperAdmin"]}>
              <DashboardLayOut />
            </AuthMiddleware>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="zonal-admin" element={<SupZonaladmin />} />
          <Route path="zonal-admin-details" element={<ZonalAdminDetails />} />
          <Route path="admin" element={<SupAdmin />} />
          <Route path="admin-details" element={<AdminDetails />} />
          <Route path="organization" element={<SupOrganization />} />
          <Route path="organization-details" element={<SupORGadminDetails />} />
          <Route path="therapist" element={<SupTherapist />} />
          <Route path="therapist-details" element={<SupTherapistDetails />} />
          <Route path="parent" element={<SupParent />} />
          <Route path="appointment" element={<SupAppointment />} />
          <Route path="add-information" element={<AddInformation />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>

        {/* ================= ZONAL ADMIN ================= */} 

        <Route
          path={routes.ZONALADMIN}
          element={
            <AuthMiddleware allowedFlags={["zonalAdmin"]}>
              <DashboardLayOut />
            </AuthMiddleware>
          }
        >

          <Route index element={<ZonalAdminIndex />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>



        {/* ================= ORGANIZATION ADMIN ================= */}

        <Route path={routes.ORGANIZATIONADMIN} element={
            <AuthMiddleware allowedFlags={["OrganizationAdmin"]}>
              <DashboardLayOut />
            </AuthMiddleware>
          }
        >
          <Route index element={<OrganizationAdminIndex />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>



        {/* ================= ADMIN ================= */}

        <Route path={routes.ADMIN} element={
            <AuthMiddleware allowedFlags={["Admin"]}>
              <DashboardLayOut />
            </AuthMiddleware>
          }
        >
          <Route index element={<AdminIndex />} />
          <Route path="settings" element={<SuperAdminSettings />} />
        </Route>



      </Routes>
    </BrowserRouter>
  );
}

export default App;
