import axios from 'axios-https-proxy-fix';


const proxyConfig = {};



export const get = async (url, params = {}, headers = {}) => {
  try {
    const response = await axios.get(url, { params, headers, ...proxyConfig });
    return response;
  } catch (error) {
    console.error('GET request failed:', error);
    throw error;
  }
};

export const post = async (url, data = {}, headers = {}) => {
  try {
    const response = await axios.post(url, data, { headers, ...proxyConfig });
    return response;
  } catch (error) {
    console.error('POST request failed:', error);
    throw error;
  }
};