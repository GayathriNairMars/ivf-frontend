import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/auth/login";
import SuperAdminDashboard from "./pages/admin/dashboard/superadmindashboard";
import DashboardHome from "./pages/admin/dashboard/dashboard";
import AddStaff from "./pages/admin/staff/add_staff";
import EditStaff from "./pages/admin/staff/edit_staff";
import StaffList from "./pages/admin/staff/staff_list";
import DepartmentSection from "./pages/admin/departments/departmentsection";
import PatientList from "./pages/admin/patients/patient_list";
import AddPatient from "./pages/admin/patients/add_patient";
import EditPatient from "./pages/admin/patients/edit_patient";
import PatientProfile from "./pages/admin/patients/patient_profile";
import EMRSection from "./pages/admin/emr/emr_section";
import EMROverview from "./pages/admin/emr/emr_overview";
import PatientEMR from "./pages/admin/emr/patient_emr";
import AddEMRRecord from "./pages/admin/emr/add_emrrecord";
import RecordManagement from "./pages/admin/emr/record_management";
import ReceptionistDashboardSection from "./pages/receptionist/section";
import AdminLoginPage from "./pages/auth/admin_login";
import CreateEMRWrapper from "./pages/admin/emr/create_emr";


const Placeholder = ({ title }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{title}</h2>
      <p>The dashboard is under construction</p>
      <button
        onClick={handleLogout}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#6366f1", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
      >
        Sign Out
      </button>
    </div>
  );
};

function Unauthorized() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2> Access Denied</h2>
      <p>You do not have permission to view this page</p>
      <a href="/login">Back to  Login</a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/*Public*/}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/*Super Admin*/}
        <Route path="/superadmin" element={
          <ProtectedRoute requiredRole="ADM">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="staff/add" element={<AddStaff />} />
          <Route path="staff/edit/:id" element={<EditStaff />} />
          <Route path="department" element={<DepartmentSection />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="patients/add" element={<AddPatient />} />
          <Route path="patients/:id/edit" element={<EditPatient />} />
          <Route path="patients/:id" element={<PatientProfile />} />
          <Route path="emr" element={<EMROverview />} />
          <Route path="emr/addemrrecord" element={<CreateEMRWrapper />} />
          <Route path="emr/patients" element={<EMRSection />} />
          <Route path="emr/patients/:patientId" element={<EMRSection />} />
          <Route path="/superadmin/emr/patients/:patientId/create" element={<EMRSection />} />
          <Route path="emr/records" element={<RecordManagement />} />
        </Route>

        {/* Receptionist */}
        <Route path="/receptionist" element={
          <ProtectedRoute requiredRole="REC">
            <ReceptionistDashboardSection />
          </ProtectedRoute>
        } />
        {/*Other roles-swap placeholder with real comp*/}
        <Route path="/hrm/*" element={<ProtectedRoute requiredRole="HRM"><Placeholder title="HR Manager Dashboard" /></ProtectedRoute>} />
        <Route path="/cco/*" element={<ProtectedRoute requiredRole="CCO"><Placeholder title="Clinical Counsellor Dashboard" /></ProtectedRoute>} />
        <Route path="/fco/*" element={<ProtectedRoute requiredRole="FCO"><Placeholder title="Financial Counsellor Dashboard" /></ProtectedRoute>} />
        <Route path="/gyn/*" element={<ProtectedRoute requiredRole="GYN"><Placeholder title="Gynaecologist Dashboard" /></ProtectedRoute>} />
        <Route path="/ane/*" element={<ProtectedRoute requiredRole="ANE"><Placeholder title="Anesthesiologist Dashboard" /></ProtectedRoute>} />
        <Route path="/emb/*" element={<ProtectedRoute requiredRole="EMB"><Placeholder title="Embryologist Dashboard" /></ProtectedRoute>} />
        <Route path="/nur/*" element={<ProtectedRoute requiredRole="NUR"><Placeholder title="Nurse Dashboard" /></ProtectedRoute>} />
        <Route path="/pha/*" element={<ProtectedRoute requiredRole="PHA"><Placeholder title="Pharmacist Dashboard" /></ProtectedRoute>} />
        <Route path="/tec/*" element={<ProtectedRoute requiredRole="TEC"><Placeholder title="Lab Technician Dashboard" /></ProtectedRoute>} />
        <Route path="/and/*" element={<ProtectedRoute requiredRole="AND"><Placeholder title="Andrology Tech Dashboard" /></ProtectedRoute>} />
        <Route path="/pat/*" element={<ProtectedRoute requiredRole="PAT"><Placeholder title="Patient Dashboard" /></ProtectedRoute>} />
        <Route path="/end/*" element={<ProtectedRoute requiredRole="END"><Placeholder title="Endocrinologist Dashboard" /></ProtectedRoute>} />

        {/*Fallback*/}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}