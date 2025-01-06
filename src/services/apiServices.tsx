import axios from "axios";

const BASE_URL = "http://46.202.141.116:3000"; // Replace with your API URL

export const postData = async (endpoint: any, data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data; // Return the response data
  } catch (error) {
    throw error;
  }
};

// Function to get data from the API
export const getData = async (endpoint: string) => {
  try {
    // Sending the GET request to the specified endpoint
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json", // Ensure the correct content type
      },
    });

    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error for debugging purposes

    // You can throw the error to handle it at a higher level
    throw error;
  }
};

// Function to delete data from the API
export const deleteData = async (endpoint: string, id: number) => {
  try {
    const response = await axios.delete(`${BASE_URL}${endpoint}/${id}`);
    return response.data;
  } catch (error) {
    throw error; // Re-throw the error to be handled by the caller
  }
};

// Function to update data on the API
export const putData = async (endpoint: string, data: any) => {
  try {
    const response = await axios.put(`${BASE_URL}${endpoint}`, data, {
      headers: {
        "Content-Type": "application/json", // Ensure the correct content type
      },
    });

    // Return the updated data from the response
    return response.data;
  } catch (error) {
    throw error; // Re-throw the error to be handled by the caller
  }
};

// Function to view a specific data item by its ID
export const viewDataById = async (endpoint: string, id: number) => {
  if (id) {
    try {
      // Sending the GET request to fetch the specific item by ID
      const response = await axios.get(`${BASE_URL}${endpoint}/${id}`, {
        headers: {
          "Content-Type": "application/json", // Ensure the correct content type
        },
      });

      // You don't need to assign 'id' to 'groupId' because it's already available
      const groupId = id;

      // Return the specific data item
      return response.data;
    } catch (error) {
      // Log the error or handle it as needed
      throw error; // Re-throw the error to be handled by the caller
    }
  }
};
