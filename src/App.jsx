import { Routes,Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./features/auth/pages/login";
import SuperAdminDashboard from "./features/admin/pages/dashboard/superadmindashboard";
import DashboardHome from "./features/admin/pages/dashboard/dashboard";
import AddStaff from "./features/admin/pages/staff/add_staff";
import EditStaff from "./features/admin/pages/staff/edit_staff";
import StaffList from "./features/admin/pages/staff/staff_list";
import DepartmentSection from "./features/admin/pages/departments/departmentsection";
import PatientList from "./features/admin/pages/patients/patient_list";
import AddPatient from "./features/admin/pages/patients/add_patient";
import EditPatient from "./features/admin/pages/patients/edit_patient";
import PatientProfile from "./features/admin/pages/patients/patient_profile";
import EMRSection from "./features/admin/pages/emr/emr_section";
import PatientEMR from "./features/admin/pages/emr/patient_emr";
import ReceptionistDashboardSection from "./features/receptionist/pages/section";
import AdminLoginPage from "./features/auth/pages/admin_login";


const Placeholder = ({title}) => (
  <div style={{ padding: "2rem"}}>
    <h2>{title}</h2>
    <p>The dashboard is under construction</p>
  </div>
);

function Unauthorized() {
  return(
    <div style={{padding:"2rem", textAlign:"center"}}>
      <h2> Access Denied</h2>
      <p>You do not have permission to view this page</p>
      <a href="/login">Back to  Login</a>
    </div>
  );
}

export default function App(){
  return (
    <AuthProvider>
      <Routes>
        {/*Public*/}
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/admin-login" element={<AdminLoginPage/>}/>
        <Route path="/unauthorized" element={<Unauthorized/>}/>

        {/*Super Admin*/}
        <Route path="/superadmin" element={
          <ProtectedRoute requiredRole="ADM">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome/>} />
          <Route path="staff" element={<StaffList/>} />
          <Route path="staff/add" element={<AddStaff/>} />
          <Route path="staff/edit/:id" element={<EditStaff/>} />
          <Route path="department" element={<DepartmentSection/>} />
          <Route path="patients" element={<PatientList/>}/>
          <Route path="patients/add" element={<AddPatient/>} />
          <Route path="patients/:id/edit" element={<EditPatient/>} />
          <Route path="patients/:id" element={<PatientProfile/>} />
          <Route path="emr" element={<EMRSection />} />
          <Route path="emr/:patientId" element={<EMRSection />} />
        </Route>

        {/* Receptionist */}
        <Route path="/receptionist" element={
          <ProtectedRoute requiredRole="REC">
            <ReceptionistDashboardSection />
          </ProtectedRoute>
        } />
        {/*Other roles-swap placeholder with real comp*/}

        {/*Fallback*/}
        <Route path="/" element={<Navigate to="/login" replace />}/>
        <Route path="*" element={<Navigate to="/login" replace />}/>
      </Routes>
    </AuthProvider>
  );
}