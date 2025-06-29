import axios from "axios";

export const clientAPI = (sessionToken: string) => {
  return axios.create({
    baseURL: "https://api.tryonmagic.com/v1",
    headers: {
      "Content-Type": "application/json",
      "x-shopify-session-token": `Bearer ${sessionToken}`,
    },
  });
}
  

export const serverSideAPI = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const s3UploadAPIClient = (sessionToken: string) =>
  axios.create({
    baseURL: "api/images",
    headers: {
      "Content-Type": "application/json",
      "x-shopify-session-token": `Bearer ${sessionToken}`,
    },
  });
