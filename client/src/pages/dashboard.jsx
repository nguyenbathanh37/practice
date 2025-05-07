import { useEffect, useState } from "react"
import { Card, Row, Col, Statistic, Button, Typography } from "antd"
import { TeamOutlined, UserOutlined } from "@ant-design/icons"
import { observer } from "mobx-react-lite"
import { useStores } from "../stores"
import { useNavigate } from "react-router-dom"

const { Title } = Typography

const Dashboard = observer(() => {
  const { userStore, authStore } = useStores()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await userStore.fetchUsers()
      setLoading(false)
    }

    fetchData()
  }, [userStore])

  return (
    <div className="dashboard-container">
      <Title level={2}>Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading}>
            <Statistic title="Total Users" value={userStore.totalUsers} prefix={<TeamOutlined />} />
            <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate("/users")}>
              View All Users
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Current User" value={userStore.authStore.currentUser?.name || "N/A"} prefix={<UserOutlined />} />
            <Button type="default" style={{ marginTop: 16 }} onClick={() => navigate("/profile")}>
              View Profile
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="API Status" value="Online" valueStyle={{ color: "#3f8600" }} />
            <Button
              type="default"
              style={{ marginTop: 16 }}
              onClick={() => userStore.exportUserData()}
              loading={userStore.isLoading}
            >
              Export User Data
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  )
})

export default Dashboard