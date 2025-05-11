import { makeAutoObservable, runInAction } from "mobx"
import { message } from "antd"
import { api, uploadFileToS3 } from "../services/api"

class AuthStore {
  currentUser = null
  token = null
  isAuthenticated = false
  isLoading = false
  avatarUploading = false
  avatarUrl = null
  avatarLoading = false

  constructor() {
    makeAutoObservable(this)
    this.initFromStorage()
    if (this.currentUser) {
      this.fetchAvatarUrl(this.currentUser.id)
    }
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

      if (response.data.user) {
        this.fetchAvatarUrl(response.data.user.id)
      }

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

  async fetchAvatarUrl(userId) {
    this.avatarLoading = true

    try {
      const response = await api.get(`/auth/getAvatar/${userId}`)

      runInAction(() => {
        this.avatarUrl = response.data.avatarUrl
        this.avatarLoading = false
      })

      return true
    } catch (error) {
      runInAction(() => {
        this.avatarLoading = false
      })

      console.error("Failed to fetch avatar URL:", error)
      return false
    }
  }

  async updateProfile(name, isRealEmail=true, contactEmail = null) {
    this.isLoading = true

    try {
      await api.post("/auth/updateProfile", { name, isRealEmail, contactEmail })

      runInAction(() => {
        if (this.currentUser) {
          this.currentUser.name = name
          this.currentUser.isRealEmail = isRealEmail
          this.currentUser.contactEmail = contactEmail
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
        if (this.currentUser) {
          await this.fetchAvatarUrl(this.currentUser.id)
        }

        runInAction(() => {
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
    this.avatarUrl = null
    localStorage.removeItem("token")
    message.success("Logged out successfully")
  }
}

export default AuthStore