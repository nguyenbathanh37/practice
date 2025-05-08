import { useEffect, useState } from "react"
import { Table, Button, Input, Space, Modal, Form, Typography, Popconfirm, Tooltip } from "antd"
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined } from "@ant-design/icons"
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
      email: user.email,
    })
    setIsModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingUser) {
        await userStore.updateUser(editingUser.id, values.name)
      } else {
        await userStore.createUser(values.email, values.name)
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
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button icon={<DeleteOutlined />} type="text" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
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
        </Form>
      </Modal>
    </div>
  )
})

export default UserManagement