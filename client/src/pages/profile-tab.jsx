import { useState, useEffect } from "react"
import { notification, Card, Form, Input, Button, Typography, Divider, Avatar, Upload, message, Spin, Checkbox } from "antd"
import { UserOutlined, UploadOutlined } from "@ant-design/icons"
import { observer } from "mobx-react-lite"
import { useStores } from "../stores"

const { Title } = Typography

const ProfileTab = observer(() => {
  const { authStore } = useStores()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState([])
  const [previewImage, setPreviewImage] = useState(null)
  const [isRealEmailChecked, setIsRealEmailChecked] = useState(authStore.currentUser?.isRealEmail || false)

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message: message,
      description: description,
      duration: 5,
    });
  };

  useEffect(() => {

    if (authStore.currentUser && !authStore.avatarUrl) {
      authStore.fetchAvatarUrl(authStore.currentUser.id)
    }
  }, [authStore])

  const onFinish = async (values) => {
    setLoading(true)
    if (fileList.length > 0) {
      handleUpload()
    }
    const success = await authStore.updateProfile(values.name, isRealEmailChecked, values.contactEmail)
    setLoading(false)

    if (success) {
      openNotification(
        "success",
        "Update Profile Successful",
      )
    } else {
      openNotification(
        "error",
        "Update Profile Failed",
      )
    } 
  }

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/")
    if (!isImage) {
      message.error("You can only upload image files!")
      return false
    }

    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!")
      return false
    }

    // Preview the image
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target.result)
    }
    reader.readAsDataURL(file)

    // Update file list
    setFileList([file])

    // Return false to prevent automatic upload
    return false
  }

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning("Please select an image first!")
      return
    }

    const file = fileList[0]
    const success = await authStore.uploadAvatar(file)

    if (success) {
      setFileList([])
      setPreviewImage(null)
    }
  }

  const getAvatarUrl = () => {
    if (previewImage) {
      return previewImage
    }

    if (authStore.avatarUrl) {
      return authStore.avatarUrl
    }

    return null
  }

  return (
    <div className="profile-container">
      {contextHolder}
      {/* <Title level={2}>My Profile</Title> */}

      <Card className="profile-card">
        <div className="profile-header">
          <div className="avatar-container">
            {authStore.avatarLoading ? (
              <Spin size="large" />
            ) : (
              <Avatar size={100} icon={<UserOutlined />} src={getAvatarUrl()} className="profile-avatar" />
            )}
            <div className="avatar-upload">
              <Upload beforeUpload={beforeUpload} fileList={fileList} showUploadList={false} accept="image/*">
                <Button icon={<UploadOutlined />} size="small">
                  Select Image
                </Button>
              </Upload>
            </div>
          </div>
          <div className="profile-info">
            <Title level={3}>{authStore.currentUser?.adminName}</Title>
            <p>{authStore.currentUser?.loginId}</p>
          </div>
        </div>

        <Divider />

        <Form form={form} layout="vertical" initialValues={{employeeId: authStore.currentUser?.employeeId , name: authStore.currentUser?.adminName, loginId: authStore.currentUser?.loginId , isRealEmail: authStore.currentUser?.isRealEmail, contactEmail: authStore.currentUser?.contactEmail }} onFinish={onFinish}>
          <Form.Item name="employeeId" label="Employee Id">
            <Input disabled/>
          </Form.Item>
          
          <Form.Item name="name" label="Admin Name" rules={[{ required: true, message: "Please input your name!" },{ max: 30, message: "Admin Name must be maximum 30 characters!" },]}>
            <Input />
          </Form.Item>

          <Form.Item name="loginId" label="Login Id">
            <Input disabled/>
          </Form.Item>

          <Form.Item name="isRealEmail" valuePropName="checked" label={null} onChange={(e) => setIsRealEmailChecked(e.target.checked)}>
            <Checkbox disabled={!authStore.currentUser?.isRealEmail}>Real Email</Checkbox>
          </Form.Item>

          {!isRealEmailChecked && (
            <Form.Item name="contactEmail" label="Contact Email" rules={[{ required: true, message: "Please input your contact email!" }, { type: "email", message: "Please enter a valid email!" }, { max: 111, message: "Contact Email must be maximum 111 characters!" }]}>
              <Input />
            </Form.Item>
          )}

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

export default ProfileTab