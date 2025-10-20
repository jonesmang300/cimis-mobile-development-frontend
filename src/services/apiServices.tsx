import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { isPlatform } from "@ionic/react";

// Detect the running environment
const isAndroid = isPlatform("android");
const isIOS = isPlatform("ios");
const isWeb = isPlatform("desktop") || isPlatform("mobileweb");

// You can adjust these for your environment
const LOCALHOST_IP = "192.168.1.179"; // your machine IP on local Wi-Fi
const LOCAL_PORT = "3000";

// Smart base URL logic
let BASE_URL = "";

if (isWeb) {
  // Browser (localhost)
  BASE_URL = `http://localhost:${LOCAL_PORT}`;
} else if (isAndroid) {
  // Android emulator uses 10.0.2.2 to access host localhost
  BASE_URL = Capacitor.isNativePlatform()
    ? `http://10.0.2.2:${LOCAL_PORT}`
    : `http://${LOCALHOST_IP}:${LOCAL_PORT}`;
} else if (isIOS) {
  // iOS simulator can use localhost, real device uses your machine IP
  BASE_URL = Capacitor.isNativePlatform()
    ? `http://${LOCALHOST_IP}:${LOCAL_PORT}`
    : `http://localhost:${LOCAL_PORT}`;
} else {
  // fallback
  BASE_URL = `http://${LOCALHOST_IP}:${LOCAL_PORT}`;
}

console.log("📡 Using API base URL:", BASE_URL);

// ---- API FUNCTIONS ----

export const postData = async (endpoint: string, data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getData = async (endpoint: string) => {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteData = async (endpoint: string, id: number) => {
  try {
    const response = await axios.delete(`${BASE_URL}${endpoint}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const putData = async (endpoint: string, data: any) => {
  try {
    const response = await axios.put(`${BASE_URL}${endpoint}`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const viewDataById = async (endpoint: string, id: number) => {
  if (id) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}/${id}`, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
