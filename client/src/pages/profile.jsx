import { useState, useEffect } from "react"
import { Card, Form, Input, Button, Typography, Divider, Avatar, Upload, message, Spin } from "antd"
import { UserOutlined, UploadOutlined } from "@ant-design/icons"
import { observer } from "mobx-react-lite"
import { useStores } from "../stores"

const { Title } = Typography

const Profile = observer(() => {
  const { authStore } = useStores()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState([])
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {

    if (authStore.currentUser && !authStore.avatarUrl) {
      authStore.fetchAvatarUrl(authStore.currentUser.id)
    }
  }, [authStore])

  const onFinish = async (values) => {
    setLoading(true)
    await authStore.updateProfile(values.name)
    setLoading(false)
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
      <Title level={2}>My Profile</Title>

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
              {fileList.length > 0 && (
                <Button
                  type="primary"
                  onClick={handleUpload}
                  loading={authStore.avatarUploading}
                  size="small"
                  style={{ marginTop: "8px" }}
                >
                  Upload
                </Button>
              )}
            </div>
          </div>
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