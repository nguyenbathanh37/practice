import "./styles/global.scss"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ConfigProvider } from "antd"
import { observer } from "mobx-react-lite"
import Login from "./pages/login"
import Dashboard from "./pages/dashboard"
import UserManagement from "./pages/user-management"
import Profile from "./pages/profile"
import ChangePassword from "./pages/change-password"
import { useStores } from "./stores"
import PrivateRoute from "./components/private-route"
import AppLayout from "./components/app-layout"
import ExportManagement from "./pages/export-management"
import ChangePasswordExpired from "./pages/change-password-expired"
import ForgotPassword from "./pages/forgot-password"
import ResetPassword from "./pages/reset-password"

const App = observer(() => {
  const { authStore } = useStores()

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={authStore.isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/change-password-expired" element={<ChangePasswordExpired />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="exports" element={<ExportManagement />} />
            <Route path="profile" element={<Profile />} />
            {/* <Route path="change-password" element={<ChangePassword />} /> */}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  )
})

export default App