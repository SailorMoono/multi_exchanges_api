const axios = require('axios-https-proxy-fix')


// 封装 GET 请求方法
const get = async (url, params = {}, headers = {}) => {
    try {
        const response = await axios.get(url, { params, headers, ...proxyConfig }); // 注意：直接传递 proxyConfig 可能不起作用
        return response;
    } catch (error) {
        // 处理错误，例如打印错误消息或抛出异常
        console.error('GET request failed:', error);
        throw error;
    }
};

// 封装 POST 请求方法
const post = async (url, data = {}, headers = {}) => {
    try {
        // 同上，这里使用 axios.post，并假设库会在全局处理代理设置
        const response = await axios.post(url, data, { headers, ...proxyConfig }); // 注意：直接传递 proxyConfig 可能不起作用
        return response;
    } catch (error) {
        // 处理错误
        console.error('POST request failed:', error);
        throw error;
    }
};
// 导出 GET 和 POST 方法
module.exports = {
    get,
    post
};