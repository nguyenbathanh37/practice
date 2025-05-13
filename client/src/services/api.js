import axios from "axios"

const BASE_URL = "https://js6gw2bz7k.execute-api.ap-southeast-1.amazonaws.com/dev"

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle auth errors
// api.interceptors.response.use(
//   (response) => {
//     return response
//   },
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       // Clear local storage and redirect to login
//       localStorage.removeItem("token")
//       window.location.href = "/login"
//     }
//     return Promise.reject(error)
//   },
// )

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      if (error.response.data && error.response.data.code === "PASSWORD_EXPIRED") {
        localStorage.setItem("passwordExpired", "true")
        localStorage.setItem("lastPasswordChange", error.response.data.lastPasswordChange)

        if (window.location.pathname !== "/change-password-expired" && window.location.pathname !== "/login") {
          window.location.href = "/change-password-expired"
        }

        return Promise.reject(error)
      }
      if (error.response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("passwordExpired")
        localStorage.removeItem("lastPasswordChange")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export const uploadFileToS3 = async (presignedUrl, file) => {
  try {
    await axios.put(presignedUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
    })
    return true
  } catch (error) {
    console.error("Error uploading file to S3:", error)
    return false
  }
}