import { Navigate } from "react-router-dom"
import { observer } from "mobx-react-lite"
import { useStores } from "../stores"

const PrivateRoute = observer(({ children }) => {
  const { authStore } = useStores()

  if (!authStore.isAuthenticated) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
})

export default PrivateRoute