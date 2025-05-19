import { makeAutoObservable, runInAction } from "mobx"
import { message } from "antd"
import { api, uploadFileToS3 } from "../services/api"

class AuthStore {
  currentUser = null
  token = null
  refreshToken = null
  isAuthenticated = false
  isLoading = false
  avatarUploading = false
  avatarUrl = null
  avatarLoading = false

  constructor() {
    makeAutoObservable(this)
    this.initFromStorage()
  }

  initFromStorage() {
    const token = localStorage.getItem("token")
    const refreshToken = localStorage.getItem("refreshToken")
    const passwordExpired = localStorage.getItem("passwordExpired")

    if (token) {
      this.token = token
      this.refreshToken = refreshToken
      this.isAuthenticated = true
      if (!passwordExpired) {
        this.getCurrentUser().then((success) => {
          if (success) {
            this.fetchAvatarUrl(this.currentUser.id)
          }
        })
      }
    }
  }

  setToken(token, refreshToken) {
    this.token = token
    this.refreshToken = refreshToken
    localStorage.setItem("token", token)
    localStorage.setItem("refreshToken", refreshToken)
  }

  setCurrentUser(admin) {
    this.currentUser = admin
  }

  async login(email, password) {

    try {
      const hashPassword = window.btoa(password)
      const response = await api.post("/auth/login", { email, password: hashPassword })

      runInAction(() => {
        this.setToken(response.data.token, response.data.refreshToken)
        this.isAuthenticated = true
      })

      if (response.data.admin) {
        this.fetchAvatarUrl(response.data.admin.id)
      }

      message.success("Login successful")
      return true
    } catch (error) {

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

      message.error("Failed to fetch admin data")
      return false
    }
  }

  async fetchAvatarUrl(adminId) {
    this.avatarLoading = true

    try {
      const response = await api.get(`/auth/getAvatar/${adminId}`)

      runInAction(() => {
        this.avatarUrl = response.data.avatarUrl
        this.avatarLoading = false
        console.log("adminId: ", adminId);
        console.log("avatar: ", response.data.avatarUrl);

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

  async updateProfile(name, isRealEmail = true, contactEmail = null) {
    // this.isLoading = true

    try {
      await api.post("/auth/updateProfile", { adminName: name, isRealEmail, contactEmail })

      runInAction(() => {
        if (this.currentUser) {
          this.currentUser.adminName = name
          this.currentUser.isRealEmail = isRealEmail
          this.currentUser.contactEmail = contactEmail
          this.setCurrentUser(this.currentUser)
        }
        // this.isLoading = false
      })

      message.success("Profile updated successfully")
      return true
    } catch (error) {
      runInAction(() => {
        // this.isLoading = false
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

    try {
      await api.post("/auth/changePassword", { oldPassword, newPassword })

      message.success("Password changed successfully")
      return true
    } catch (error) {
      message.error("Failed to change password")
      return false
    }
  }

  async changePasswordExpired(oldPassword, newPassword) {
    // this.isLoading = true

    try {
      await api.post("/auth/ChangePasswordExpired", { oldPassword, newPassword })

      // runInAction(() => {
      //   this.isLoading = false
      // })

      message.success("Password changed successfully")
      localStorage.removeItem("passwordExpired")
      localStorage.removeItem("lastPasswordChange")
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      window.location.href = "/dashboard"
      return true
    } catch (error) {
      // runInAction(() => {
      //   this.isLoading = false
      // })

      message.error("Failed to change password")
      return false
    }
  }

  async forgotPassword(email) {
    this.isLoading = true

    try {
      await api.post("/auth/forgot-password", { email })

      runInAction(() => {
        this.isLoading = false
      })

      message.success(`New password has been sent to ${email}`)
      return true
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
      })

      message.error("Failed to reset password")
      return false
    }
  }

  async resetPassword(token, newPassword) {
    this.isLoading = true

    try {
      await api.post("/auth/resetPassword", {
        token,
        newPassword,
      })

      runInAction(() => {
        this.isLoading = false
      })

      message.success("Password has been reset successfully")
      return true
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
      })

      message.error("Failed to reset password. The link may be expired or invalid.")
      return false
    }
  }


  logout() {
    this.token = null
    this.currentUser = null
    this.isAuthenticated = false
    this.avatarUrl = null
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    message.success("Logged out successfully")
  }
}

export default AuthStore