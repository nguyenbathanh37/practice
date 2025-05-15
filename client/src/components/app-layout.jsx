import React, { useState, useEffect } from "react"
import { Layout, Menu, Avatar, Dropdown, Spin } from "antd"
import {
  UserOutlined,
  TeamOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LockOutlined,
  FileExcelOutlined
} from "@ant-design/icons"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { observer } from "mobx-react-lite"
import { useStores } from "../stores"

const { Header, Sider, Content } = Layout

const AppLayout = observer(() => {
  const [collapsed, setCollapsed] = useState(false)
  const { authStore } = useStores()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (authStore.currentUser && !authStore.avatarUrl) {
      authStore.fetchAvatarUrl(authStore.currentUser.id)
    }
  }, [authStore])

  const handleLogout = () => {
    authStore.logout()
    navigate("/login")
  }

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link to="/profile">Profile</Link>,
    },
    // {
    //   key: "changePassword",
    //   icon: <LockOutlined />,
    //   label: <Link to="/change-password">Change Password</Link>,
    // },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: <span onClick={handleLogout}>Logout</span>,
    },
  ]

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light" className="app-sider">
        <div className="logo">{!collapsed && <h2>User Admin</h2>}</div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname.split("/")[1] || "dashboard"]}
          items={[
            {
              key: "dashboard",
              icon: <DashboardOutlined />,
              label: <Link to="/dashboard">Dashboard</Link>,
            },
            {
              key: "users",
              icon: <TeamOutlined />,
              label: <Link to="/users">User Management</Link>,
            },
            {
              key: "exports",
              icon: <FileExcelOutlined />,
              label: <Link to="/exports">Export Management</Link>,
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: "trigger",
            onClick: () => setCollapsed(!collapsed),
          })}
          <div className="header-right">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info">
                <span className="user-name">{authStore.currentUser?.name}</span>
                {authStore.avatarLoading ? (
                  <Spin size="small" />
                ) : (
                  <Avatar icon={<UserOutlined />} src={authStore.avatarUrl} />
                )}
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          {authStore.isLoading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : (
            <Outlet />
          )}
        </Content>
      </Layout>
    </Layout>
  )
})

export default AppLayout