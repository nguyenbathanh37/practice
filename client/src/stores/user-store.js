import { makeAutoObservable, runInAction } from "mobx"
import { message } from "antd"
import { api } from "../services/api"

class UserStore {
  users = []
  totalUsers = 0
  currentPage = 1
  pageSize = 10
  isLoading = false
  searchTerm = ""
  sortField = "name"
  sortOrder = "asc"
  authStore = null
  exports = []
  exportLoading = false
  resetPasswordLoading = {}

  constructor(authStore) {
    makeAutoObservable(this)
    this.authStore = authStore
  }

  setSearchTerm(term) {
    this.searchTerm = term
  }

  setSort(field, order) {
    this.sortField = field
    this.sortOrder = order
  }

  setPage(page) {
    this.currentPage = page
  }

  setPageSize(size) {
    this.pageSize = size
  }

  async fetchUsers() {
    this.isLoading = true

    try {
      const sort = this.sortField ? `${this.sortField}_${this.sortOrder}` : undefined

      const response = await api.get("/auth/listUsers", {
        params: {
          search: this.searchTerm || undefined,
          sort,
          page: this.currentPage,
          limit: this.pageSize,
        },
      })

      runInAction(() => {
        this.users = response.data.users
        this.totalUsers = response.data.total
        this.isLoading = false
      })

      return true
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
      })

      message.error("Failed to fetch users")
      return false
    }
  }

  async createUser(email, name) {
    this.isLoading = true

    try {
      await api.post("/auth/createUser", { email, name })

      runInAction(() => {
        this.isLoading = false
      })

      message.success("User created successfully")
      await this.fetchUsers()
      return true
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
      })

      message.error("Failed to create user")
      return false
    }
  }

  async updateUser(id, name) {
    this.isLoading = true

    try {
      await api.put(`/auth/updateUser/${id}`, { name })

      runInAction(() => {
        this.isLoading = false
      })

      message.success("User updated successfully")
      await this.fetchUsers()
      return true
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
      })

      message.error("Failed to update user")
      return false
    }
  }

  async deleteUser(id) {
    this.isLoading = true

    try {
      await api.delete(`/auth/deleteUser/${id}`)

      runInAction(() => {
        this.isLoading = false
      })

      message.success("User deleted successfully")
      await this.fetchUsers()
      return true
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
      })

      message.error("Failed to delete user")
      return false
    }
  }

  async exportUserData() {
    this.exportLoading = true

    try {
      const response = await api.post("/auth/exportUserData")

      const { downloadUrl, expiresIn } = response.data
      const expiryTime = Date.now() + Number.parseInt(expiresIn) * 1000

      // Extract filename from URL
      const urlParts = downloadUrl.split("/")
      const filenameWithParams = urlParts[urlParts.length - 1]
      const filename = filenameWithParams.split("?")[0]

      const exportItem = {
        id: Date.now().toString(),
        url: downloadUrl,
        filename,
        expiryTime,
        createdAt: new Date().toISOString(),
      }

      runInAction(() => {
        this.exports.unshift(exportItem)
        this.exportLoading = false
      })

      message.success("Export generated successfully")
      return true
    } catch (error) {
      runInAction(() => {
        this.exportLoading = false
      })

      message.error("Failed to export user data")
      return false
    }
  }

  removeExpiredExports() {
    const now = Date.now()
    const validExports = this.exports.filter((exp) => exp.expiryTime > now)

    if (validExports.length !== this.exports.length) {
      runInAction(() => {
        this.exports = validExports
      })
    }
  }

  isExportExpired(exportItem) {
    return Date.now() > exportItem.expiryTime
  }

  async resetPassword(email, userId) {
    runInAction(() => {
      this.resetPasswordLoading = { ...this.resetPasswordLoading, [userId]: true }
    })

    try {
      await api.post("/auth/forgotPassword", { email })

      runInAction(() => {
        this.resetPasswordLoading = { ...this.resetPasswordLoading, [userId]: false }
      })

      message.success(`New password has been sent to ${email}`)
      return true
    } catch (error) {
      runInAction(() => {
        this.resetPasswordLoading = { ...this.resetPasswordLoading, [userId]: false }
      })

      message.error("Failed to reset password")
      return false
    }
  }

  isResetPasswordLoading(userId) {
    return !!this.resetPasswordLoading[userId]
  }
}

export default UserStore