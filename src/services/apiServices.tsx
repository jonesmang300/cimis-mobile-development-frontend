import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { isPlatform } from "@ionic/react";

// Detect platform
// const isAndroid = isPlatform("android");
// const isIOS = isPlatform("ios");
// const isWeb = isPlatform("desktop") || isPlatform("mobileweb");

// Local setup
// const LOCALHOST_IP = "192.168.1.179"; // your PC’s IP
// const LOCAL_PORT = "3000";

// Smart base URL logic
// let BASE_URL = "";

// Detect platform
const isAndroid = isPlatform("android");
const isIOS = isPlatform("ios");
const isWeb = isPlatform("desktop") || isPlatform("mobileweb");

// Your PC IP (visible from `ipconfig` or `ifconfig`)
const LOCALHOST_IP = "192.168.45.183";
const LOCAL_PORT = "3000";

let BASE_URL = "";

// ✅ Smart local logic
// if (isAndroid) {
//   BASE_URL = `http://10.0.2.2:${LOCAL_PORT}`;
// } else if (isIOS) {
//   BASE_URL = `http://${LOCALHOST_IP}:${LOCAL_PORT}`;
// } else {
//   BASE_URL = `http://localhost:${LOCAL_PORT}`;
// }

BASE_URL = `http://localhost:${LOCAL_PORT}`;

// Optional — log to verify
console.log("📡 Using API Base URL:", BASE_URL);

// Set axios base URL
axios.defaults.baseURL = BASE_URL;
// if (isWeb) {
//   BASE_URL = `http://localhost:${LOCAL_PORT}`;
// } else if (isAndroid) {
//   BASE_URL = Capacitor.isNativePlatform()
//     ? `http://10.0.2.2:${LOCAL_PORT}`
//     : `http://${LOCALHOST_IP}:${LOCAL_PORT}`;
// } else if (isIOS) {
//   BASE_URL = Capacitor.isNativePlatform()
//     ? `http://${LOCALHOST_IP}:${LOCAL_PORT}`
//     : `http://localhost:${LOCAL_PORT}`;
// } else {
//   BASE_URL = `http://${LOCALHOST_IP}:${LOCAL_PORT}`;
// }

// // ✅ Use ngrok for real device testing
// const BASE_URL = import.meta.env.VITE_BASE_URL;
// axios.defaults.baseURL = BASE_URL;
// console.log("vit>>>>>>>>>", import.meta.env.VITE_BASE_URL);

// ---- API FUNCTIONS ----
export const postData = async (endpoint: string, data: any) => {
  const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

export const getData = async (endpoint: string) => {
  const url = `${BASE_URL}${endpoint}`;
  console.log("🔹 GET:", url);
  const response = await axios.get(url, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

export const deleteData = async (endpoint: string, id: number) => {
  const response = await axios.delete(`${BASE_URL}${endpoint}/${id}`);
  return response.data;
};

export const putData = async (endpoint: string, data: any) => {
  const response = await axios.put(`${BASE_URL}${endpoint}`, data, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

export const viewDataById = async (endpoint: string, id: number) => {
  if (!id) return null;
  const response = await axios.get(`${BASE_URL}${endpoint}/${id}`, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};
