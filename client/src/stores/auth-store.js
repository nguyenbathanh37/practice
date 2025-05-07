import { makeAutoObservable, runInAction } from "mobx"
import { message } from "antd"
import { api, uploadFileToS3 } from "../services/api"

class AuthStore {
  currentUser = null
  token = null
  isAuthenticated = false
  isLoading = false
  avatarUploading = false

  constructor() {
    makeAutoObservable(this)
    this.initFromStorage()
    // this.getCurrentUser()
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

      runInAction(() => {
        this.setToken(response.data.token)
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

  async getCurrentUser() {
    this.isLoading = true

    try {
      const response = await api.get("/auth/getMe")

      runInAction(() => {
        this.setCurrentUser(response.data)
        this.isLoading = false
      })

      return true
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
      })

      message.error("Failed to fetch user data")
      return false
    }
  }

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

  async uploadAvatar(file) {
    this.avatarUploading = true

    try {
      // Step 1: Get presigned URL from the API
      const response = await api.post("/auth/uploadAvatar")
      const { uploadURL } = response.data

      // Step 2: Upload the file to S3 using the presigned URL
      const uploadSuccess = await uploadFileToS3(uploadURL, file)

      if (uploadSuccess) {
        // Extract the avatar URL from the presigned URL
        // The avatar URL is the base part of the presigned URL (without query parameters)
        const avatarUrl = uploadURL.split("?")[0]

        runInAction(() => {
          if (this.currentUser) {
            this.currentUser.avatar = avatarUrl
            this.setCurrentUser(this.currentUser)
          }
          this.avatarUploading = false
        })

        message.success("Avatar uploaded successfully")
        return true
      } else {
        throw new Error("Failed to upload file to S3")
      }
    } catch (error) {
      runInAction(() => {
        this.avatarUploading = false
      })

      message.error("Failed to upload avatar")
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