import { useState } from "react"
import { Card, Form, Input, Button, Typography, Divider, Avatar } from "antd"
import { UserOutlined } from "@ant-design/icons"
import { observer } from "mobx-react-lite"
import { useStores } from "../stores"

const { Title } = Typography

const Profile = observer(() => {
  const { authStore } = useStores()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    await authStore.updateProfile(values.name)
    setLoading(false)
  }

  return (
    <div className="profile-container">
      <Title level={2}>My Profile</Title>

      <Card className="profile-card">
        <div className="profile-header">
          <Avatar size={100} icon={<UserOutlined />} className="profile-avatar" />
          <div className="profile-info">
            <Title level={3}>{authStore.currentUser?.name}</Title>
            <p>{authStore.currentUser?.email}</p>
          </div>
        </div>

        <Divider />

        <Form form={form} layout="vertical" initialValues={{ name: authStore.currentUser?.name }} onFinish={onFinish}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input your name!" }]}>
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
})

export default Profile