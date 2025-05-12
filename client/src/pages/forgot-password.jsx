import { useState } from "react"
import { Form, Input, Button, Card, Typography, notification } from "antd"
import { UserOutlined, LockOutlined } from "@ant-design/icons"
import { observer } from "mobx-react-lite"
import { useNavigate } from "react-router-dom"
import { useStores } from "../stores"

const { Title } = Typography

const ForgotPassword = observer(() => {
    const { authStore } = useStores()
    const navigate = useNavigate()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    const [api, contextHolder] = notification.useNotification();
    const openNotification = (type, message, description) => {
        api[type]({
            message: message,
            description: description,
            duration: 5,
        });
    };

    const onFinish = async (values) => {
        setLoading(true)
        const success = await authStore.forgotPassword(values.email)
        setLoading(false)

        if (success) {
            openNotification(
                "success",
                "Reset Password Successful",
            )
            navigate("/login")
        } else {
            openNotification(
                "error",
                "Reset Password Failed",
            )
        }
    }

    return (
        <div className="login-container">
            {contextHolder}
            <Card className="login-card">
                <div className="login-header">
                    <Title level={2}>User Management System</Title>
                    <Title level={4}>Forgot Password</Title>
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

                    <Form.Item>
                        <a href="/login">Sign In</a>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Reset Password
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
})

export default ForgotPassword