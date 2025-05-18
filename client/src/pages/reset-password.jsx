import { useState, useEffect } from "react"
import { Card, Form, Input, Button, Typography, message } from "antd"
import { LockOutlined } from "@ant-design/icons"
import { observer } from "mobx-react-lite"
import { useStores } from "../stores"
import { useLocation, useNavigate } from "react-router-dom";

const { Title } = Typography

const ResetPassword = observer(() => {
    const { authStore } = useStores()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tokenFromURL = queryParams.get("token");
        if (!tokenFromURL) {
            message.error("Missing token");
            navigate("/login");
        } else {
            setToken(tokenFromURL);
        }
    }, [location, navigate]);

    const onFinish = async (values) => {
        setLoading(true)
        const success = await authStore.resetPassword(token, values.newPassword)
        setLoading(false)

        if (success) {
            form.resetFields()
            navigate("/login");
        }
    }

    return (
        <div className="change-password-expired-container">
            <Card className="password-card">
                <div className="change-password-expired-header">
                    <Title level={2}>Change Password</Title>
                </div>

                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                            { required: true, message: "Please input your new password!" },
                            { min: 8, message: "Password must be at least 8 characters!" },
                            {
                                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                                message: "Password must contain uppercase, lowercase, number and special character!",
                            },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Confirm Password"
                        dependencies={["newPassword"]}
                        rules={[
                            { required: true, message: "Please confirm your password!" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("newPassword") === value) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(new Error("The two passwords do not match!"))
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Change Password
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
})

export default ResetPassword