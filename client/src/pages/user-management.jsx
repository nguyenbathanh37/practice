import { useEffect, useState } from "react"
import { Table, Button, Input, Space, Modal, Form, Typography, Tooltip, Checkbox } from "antd"
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
  const [isRealEmailChecked, setIsRealEmailChecked] = useState(false)
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [isResetPasswordModalVisible, setIsResetPasswordModalVisible] = useState(false)
  const [userToResetPassword, setUserToResetPassword] = useState(null)

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
    setIsModalVisible(true)
  }

  const showEditModal = (user) => {
    setEditingUser(user)
    form.setFieldsValue({
      name: user.name,
      isRealEmail: !user.isRealEmail,
      contactEmail: user.contactEmail,
    })
    setIsRealEmailChecked(!user.isRealEmail)
    setIsModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingUser) {
        await userStore.updateUser(editingUser.id, values.name, !values.isRealEmail, values.contactEmail)
      } else {
        await userStore.createUser(values.email, values.name, !values.isRealEmail, values.contactEmail)
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
      await userStore.deleteUser(userToDelete.id)
      setIsDeleteModalVisible(false)
      setUserToDelete(null)
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
      await userStore.resetPassword(userToResetPassword.email, userToResetPassword.userId)
      setIsResetPasswordModalVisible(false)
      setUserToResetPassword(null)
    }
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: true,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} type="text" />
          </Tooltip>

          <Tooltip title="Reset Password">
            <Button
              icon={<KeyOutlined />}
              type="text"
              onClick={() => showResetPasswordModal(record)}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button icon={<DeleteOutlined />} type="text" danger onClick={() => showDeleteModal(record)} />
          </Tooltip>
        </Space >
      ),
    },
  ]

  return (
    <div className="user-management-container">
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
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input the name!" }]}>
            <Input />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please input the email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input />
            </Form.Item>
          )}

          <Form.Item name="isRealEmail" valuePropName="checked" label={null} onChange={(e) => setIsRealEmailChecked(e.target.checked)}>
            <Checkbox>Real Email</Checkbox>
          </Form.Item>

          {isRealEmailChecked && (
            <Form.Item name="contactEmail" label="Contact Email" rules={[{ required: true, message: "Please input your contact email!" }]}>
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