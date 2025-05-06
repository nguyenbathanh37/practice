import { createContext, useContext } from "react"
import AuthStore from "./auth-store"
import UserStore from "./user-store"

const storeContext = createContext(null)

export const StoreProvider = ({ children }) => {
  const authStore = new AuthStore()
  const userStore = new UserStore(authStore)

  return <storeContext.Provider value={{ authStore, userStore }}>{children}</storeContext.Provider>
}

export const useStores = () => {
  const context = useContext(storeContext)
  if (!context) {
    throw new Error("useStores must be used within a StoreProvider")
  }
  return context
}