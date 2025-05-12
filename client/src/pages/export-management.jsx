import { useState, useEffect } from "react"
import { Card, List, Button, Typography, Tag, Space, Empty, Divider } from "antd"
import { DownloadOutlined, ClockCircleOutlined, FileExcelOutlined } from "@ant-design/icons"
import { observer } from "mobx-react-lite"
import { useStores } from "../stores"

const { Title, Text } = Typography

const ExportManagement = observer(() => {
  const { userStore } = useStores()
  const [, setForceUpdate] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate((prev) => prev + 1)
      userStore.removeExpiredExports()
    }, 1000)

    return () => clearInterval(timer)
  }, [userStore])

  const handleDownload = (url, filename) => {
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const formatTimeRemaining = (expiryTime) => {
    const now = Date.now()
    const timeRemaining = expiryTime - now

    if (timeRemaining <= 0) {
      return "Expired"
    }

    const seconds = Math.floor(timeRemaining / 1000)
    return `${seconds} seconds`
  }

  const handleExport = async () => {
    await userStore.exportUserData()
  }

  return (
    <div className="export-management-container">
      <div className="page-header">
        <Title level={2}>Export Management</Title>
        <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExport} loading={userStore.exportLoading}>
          Generate New Export
        </Button>
      </div>

      <Card className="exports-card">
        <Title level={4}>Recent Exports</Title>
        <Text type="secondary">
          Export links are valid for 60 seconds. Click the download button to download the file before it expires.
        </Text>

        <Divider />

        {userStore.exports.length === 0 ? (
          <Empty description="No exports available" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={userStore.exports}
            renderItem={(item) => {
              const isExpired = userStore.isExportExpired(item)
              const timeRemaining = formatTimeRemaining(item.expiryTime)

              return (
                <List.Item
                  key={item.filename}
                  actions={[
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(item.url, item.filename)}
                      disabled={isExpired}
                    >
                      Download
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileExcelOutlined style={{ fontSize: "24px", color: "#52c41a" }} />}
                    title={item.filename}
                    description={
                      <Space direction="vertical">
                        <Text>Created: {new Date(item.createdAt).toLocaleString()}</Text>
                        <Space>
                          <ClockCircleOutlined />
                          <Text>Status:</Text>
                          {isExpired ? (
                            <Tag color="red">Expired</Tag>
                          ) : (
                            <Tag color="green">Valid for {timeRemaining}</Tag>
                          )}
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )
            }}
          />
        )}
      </Card>
    </div>
  )
})

export default ExportManagement