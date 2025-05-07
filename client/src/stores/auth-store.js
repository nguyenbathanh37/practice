import { makeAutoObservable, runInAction } from "mobx"
import { message } from "antd"
import { api } from "../services/api"

class AuthStore {
  currentUser = null
  token = null
  isAuthenticated = false
  isLoading = false

  constructor() {
    makeAutoObservable(this)
    this.initFromStorage()
  }

  initFromStorage() {
    const token = localStorage.getItem("token")

    if (token) {
      this.token = token
      this.isAuthenticated = true
    }
  }

  setToken(token) {
    this.token = token
    localStorage.setItem("token", token)
  }

  setCurrentUser(user) {
    this.currentUser = user
  }

  async login(email, password) {
    this.isLoading = true

    try {
      const response = await api.post("/auth/login", { email, password })
      const response2 = await api.get("/auth/getMe")

      runInAction(() => {
        this.setToken(response.data.token)
        this.setCurrentUser(response2.data)
        this.isAuthenticated = true
        this.isLoading = false
      })

      message.success("Login successful")
      return true
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
      })

      message.error("Login failed. Please check your credentials.")
      return false
    }
  }

  // async getCurrentUser() {
  //   this.isLoading = true

  //   try {
  //     const response = await api.get("/auth/getMe")

  //     runInAction(() => {
  //       this.setCurrentUser(response.data)
  //       this.isLoading = false
  //     })

  //     return true
  //   } catch (error) {
  //     runInAction(() => {
  //       this.isLoading = false
  //     })

  //     message.error("Failed to fetch user data")
  //     return false
  //   }
  // }

  async updateProfile(name) {
    this.isLoading = true

    try {
      await api.post("/auth/updateProfile", { name })

      runInAction(() => {
        if (this.currentUser) {
          this.currentUser.name = name
          this.setCurrentUser(this.currentUser)
        }
        this.isLoading = false
      })

      message.success("Profile updated successfully")
      return true
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
      })

      message.error("Failed to update profile")
      return false
    }
  }

  async changePassword(oldPassword, newPassword) {
    this.isLoading = true

    try {
      await api.post("/auth/changePassword", { oldPassword, newPassword })

      runInAction(() => {
        this.isLoading = false
      })

      message.success("Password changed successfully")
      return true
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
      })

      message.error("Failed to change password")
      return false
    }
  }

  logout() {
    this.token = null
    this.currentUser = null
    this.isAuthenticated = false
    localStorage.removeItem("token")
    message.success("Logged out successfully")
  }
}

export default AuthStore