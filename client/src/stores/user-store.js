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
    this.isLoading = true

    try {
      const response = await api.post(
        "/auth/exportUserData",
        {},
        {
          responseType: "blob",
        },
      )

      runInAction(() => {
        this.isLoading = false
      })

      // Create a download link for the file
      const url = window.URL.createObjectURL(new Blob([response.data.downloadUrl]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "user_data.csv")
      document.body.appendChild(link)
      link.click()
      link.remove()

      message.success("User data exported successfully")
      return true
    } catch (error) {
      runInAction(() => {
        this.isLoading = false
      })

      message.error("Failed to export user data")
      return false
    }
  }
}

export default UserStore