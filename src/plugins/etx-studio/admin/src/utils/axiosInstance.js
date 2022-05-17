/**
 * axios with a custom config.
 */

import axios from 'axios';
import { auth } from '@strapi/helper-plugin';

const instance = axios.create({
  baseURL: process.env.STRAPI_ADMIN_BACKEND_URL,
});

instance.interceptors.request.use(
  async (config) => {
    config.headers = {
      Authorization: `Bearer ${auth.getToken()}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...config.headers
    };

    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // whatever you want to do with the error
    // if (error.response?.status === 401) {
    //   auth.clearAppStorage();
    //   window.location.reload();
    // }
    console.error(error);
    throw error;
  }
);

export default instance;