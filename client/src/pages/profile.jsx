import { Typography, Tabs } from "antd"
import { observer } from "mobx-react-lite"
import ProfileTab from "./profile-tab"
import ChangePassword from "./change-password"

const { Title } = Typography

const Profile = observer(() => {

  const items = [
    {
      key: '1',
      label: <Title level={4}>Profile</Title>,
      children: <ProfileTab />,
    },
    {
      key: '2',
      label: <Title level={4}>Change Password</Title>,
      children: <ChangePassword />,
    },
  ];

  return (
    <div className="profile-container">
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  )
})

export default Profile