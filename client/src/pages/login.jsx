import { useState } from "react"
import { Form, Input, Button, Card, Typography } from "antd"
import { UserOutlined, LockOutlined } from "@ant-design/icons"
import { observer } from "mobx-react-lite"
import { useNavigate } from "react-router-dom"
import { useStores } from "../stores"

const { Title } = Typography

const Login = observer(() => {
  const { authStore } = useStores()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    const success = await authStore.login(values.email, values.password)
    setLoading(false)

    if (success) {
      const currentUser = await authStore.getCurrentUser()
      if (currentUser) {
        navigate("/dashboard")
      }
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2}>User Management System</Title>
          <Title level={4}>Login</Title>
        </div>

        <Form
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: "Please input your password!" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Log in
            </Button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <p>Em hay quên lười nhập 😁😁😁</p>
          <p>Email: admin@example.com</p>
          <p>Password: Admin1234@</p>
        </div>
      </Card>
    </div>
  )
})

export default Login