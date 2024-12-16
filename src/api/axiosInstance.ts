import axios from "axios";

const API_BASE_URL = "http://localhost:3000"; // Replace with your backend's actual URL

const axiosInstance = axios.create({
  baseURL: API_BASE_URL, // This is the URL for your backend
  headers: {
    "Content-Type": "application/json", // Tell the server we're sending JSON data
  },
});

export default axiosInstance;
