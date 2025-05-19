import { useEffect, useState } from "react"
import { Table, Button, Input, Space, Modal, Form, Typography, Tooltip, Checkbox, notification } from "antd"
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined, KeyOutlined } from "@ant-design/icons"
import { observer } from "mobx-react-lite"
import { useStores } from "../stores"
import { useNavigate } from "react-router-dom"

const { Title } = Typography

const UserManagement = observer(() => {
  const { userStore } = useStores()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [editingUser, setEditingUser] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [isRealEmailChecked, setIsRealEmailChecked] = useState(true)
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [isResetPasswordModalVisible, setIsResetPasswordModalVisible] = useState(false)
  const [userToResetPassword, setUserToResetPassword] = useState(null)

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message: message,
      description: description,
      duration: 5,
    });
  };

  useEffect(() => {
    userStore.fetchUsers()
  }, [userStore])

  const handleSearch = () => {
    userStore.setSearchTerm(searchInput)
    userStore.setPage(1)
    userStore.fetchUsers()
  }

  const handleTableChange = (pagination, filters, sorter) => {
    userStore.setPage(pagination.current)
    userStore.setPageSize(pagination.pageSize)

    if (sorter.field && sorter.order) {
      userStore.setSort(sorter.field, sorter.order === "ascend" ? "asc" : "desc")
    }

    userStore.fetchUsers()
  }

  const showCreateModal = () => {
    setEditingUser(null)
    form.resetFields()
    form.setFieldsValue({
      isRealEmail: true,
    })
    setIsRealEmailChecked(true)
    setIsModalVisible(true)
  }

  const showEditModal = (user) => {
    setEditingUser(user)
    form.setFieldsValue({
      employeeId: user.employeeId,
      loginId: user.loginId,
      userName: user.userName,
      isRealEmail: user.isRealEmail,
      contactEmail: user.contactEmail,
    })
    setIsRealEmailChecked(user.isRealEmail)
    setIsModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingUser) {
        const updateStatus = await userStore.updateUser(editingUser.id, values.userName, values.contactEmail)
        if (updateStatus) {
          openNotification("success", "User Updated", "User updated successfully.")
        } else {
          openNotification("error", "User Update Failed", "Failed to update user.")
        }
      } else {
        const createStatus = await userStore.createUser(values.employeeId, values.loginId, values.userName, values.isRealEmail, values.contactEmail)
        if (createStatus) {
          openNotification("success", "User Created", "User created successfully.")
        } else {
          openNotification("error", "User Creation Failed", "Failed to create user.")
        }
      }

      setIsModalVisible(false)
    } catch (error) {
      console.error("Validation failed:", error)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
  }

  const handleDelete = async (id) => {
    await userStore.deleteUser(id)
  }

  const handleExport = async () => {
    await userStore.exportUserData()
    navigate("/exports")
  }

  const handleResetPassword = async (email, userId) => {
    await userStore.resetPassword(email, userId)
  }

  const showDeleteModal = (user) => {
    setUserToDelete(user)
    setIsDeleteModalVisible(true)
  }

  const handleDeleteModalCancel = () => {
    setIsDeleteModalVisible(false)
    setUserToDelete(null)
  }

  const handleDeleteModalConfirm = async () => {
    if (userToDelete) {
      const deleteStatus = await userStore.deleteUser(userToDelete.id)
      setIsDeleteModalVisible(false)
      setUserToDelete(null)
      if (deleteStatus) {
        openNotification("success", "User Deleted", "User deleted successfully.")
      } else {
        openNotification("error", "User Deletion Failed", "Failed to delete user.")
      }
    }
  }

  const showResetPasswordModal = (user) => {
    setUserToResetPassword(user)
    setIsResetPasswordModalVisible(true)
  }

  const handleResetPasswordModalCancel = () => {
    setIsResetPasswordModalVisible(false)
    setUserToResetPassword(null)
  }

  const handleResetPasswordModalConfirm = async () => {
    if (userToResetPassword) {
      const resetStatus = await userStore.resetPassword(userToResetPassword.email, userToResetPassword.userId)
      setIsResetPasswordModalVisible(false)
      setUserToResetPassword(null)
      if (resetStatus) {
        openNotification("success", "Password Reset", "Password reset successfully.")
      } else {
        openNotification("error", "Password Reset Failed", "Failed to reset password.")
      }
    }
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: true,
      hidden: true,
    },
    {
      title: "Employee Id",
      dataIndex: "employeeId",
      key: "employeeId",
      sorter: true,
    },
    {
      title: "User Name",
      dataIndex: "userName",
      key: "userName",
      sorter: true,
    },
    {
      title: "Login Id",
      dataIndex: "loginId",
      key: "loginId",
      sorter: true,
    },
    {
      title: "isRealEmail",
      dataIndex: "isRealEmail",
      key: "isRealEmail",
      sorter: true,
      hidden: true,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} type="text" />
          </Tooltip>

          {/* <Tooltip title="Reset Password">
            <Button
              icon={<KeyOutlined />}
              type="text"
              onClick={() => showResetPasswordModal(record)}
            />
          </Tooltip> */}

          <Tooltip title="Delete">
            <Button icon={<DeleteOutlined />} type="text" danger onClick={() => showDeleteModal(record)} />
          </Tooltip>
        </Space >
      ),
    },
  ]

  return (
    <div className="user-management-container">
      {contextHolder}
      <div className="page-header">
        <Title level={2}>User Management</Title>
        <div className="header-actions">
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={handleExport}
            loading={userStore.exportLoading}
            style={{ marginRight: "10px" }}
          >
            Export Users
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            Add User
          </Button>
        </div>
      </div>

      <div className="search-container">
        <Input
          placeholder="Search users"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          prefix={<SearchOutlined />}
          suffix={
            <Button type="text" onClick={handleSearch}>
              Search
            </Button>
          }
        />
      </div>

      <Table
        columns={columns}
        dataSource={userStore.users}
        rowKey="id"
        loading={userStore.isLoading}
        pagination={{
          current: userStore.currentPage,
          pageSize: userStore.pageSize,
          total: userStore.totalUsers,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingUser ? "Edit User" : "Create User"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={userStore.isLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="employeeId" label="Employee Id" rules={[{ required: true, message: "Please input the employee Id!" }, { max: 20, message: "Employee Id must be maximum 20 characters!" }]}>
            <Input disabled={editingUser} />
          </Form.Item>

          <Form.Item name="userName" label="User Name" rules={[{ required: true, message: "Please input the username!" }, { max: 30, message: "User Name must be maximum 30 characters!" }]}>
            <Input />
          </Form.Item>


          <Form.Item
            name="loginId"
            label="Login Id"
            rules={[
              { required: true, message: "Please input the email!" },
              { type: "email", message: "Please enter a valid email!" },
              { max: 111, message: "Login Id must be maximum 111 characters!" }
            ]}
          >
            <Input disabled={editingUser} />
          </Form.Item>


          <Form.Item name="isRealEmail" valuePropName="checked" label={null} onChange={(e) => setIsRealEmailChecked(e.target.checked)}>
            <Checkbox disabled={editingUser}>Real Email</Checkbox>
          </Form.Item>


          {!isRealEmailChecked && (
            <Form.Item name="contactEmail" label="Contact Email" rules={[{ required: true, message: "Please input your contact email!" }, { type: "email", message: "Please enter a valid email!" }, { max: 111, message: "Contact Email must be maximum 111 characters!" }]}>
              <Input />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="Delete User"
        open={isDeleteModalVisible}
        onOk={handleDeleteModalConfirm}
        onCancel={handleDeleteModalCancel}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete the user {userToDelete?.name}?</p>
        <p>This action cannot be undone.</p>
      </Modal>

      <Modal
        title="Reset Password User"
        open={isResetPasswordModalVisible}
        onOk={handleResetPasswordModalConfirm}
        onCancel={handleResetPasswordModalCancel}
        okText="Reset"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to reset password the user {userToResetPassword?.name}?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  )
})

export default UserManagement