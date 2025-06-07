import { get, post } from './request.mjs';


class ExchangeBase {
  constructor(name, apiInfo) {
    this.name = name;
    this.apiInfo = apiInfo;
  }
  setApiInfo(apiInfo) {
    this.apiInfo = apiInfo;
  }

  async getBalance(ccy) {
    throw new Error('Method not implemented: getBalance');
  }
  async getKline(symbol,period) {
    throw new Error('Method not implemented: getKline');
  }
  async getPrice(symbol) {
    throw new Error('Method not implemented: getPrice');
  }
  async get(url, params,headers={}) {
    return get(url, params,headers);
  }

  async post(url, data,headers={}) {
    return post(url, data,headers);
  }
  async baseGet(URI,pathData){
    throw new Error('Method not implemented: baseGet');
  }

  async basePost (URI,body) {
    throw new Error('Method not implemented: basePost');
  }

  async safeExecute(promise, context = '') {
      try {
          const result = await promise;
          return { success: true, data: result };
      } catch (error) {
          console.error(`[${context}] Error:`, error.message); // 只打印简化的错误信息
          return { success: false, error: error.message }; // 返回简化的错误信息
      }
  }

  
 
}

export default ExchangeBase;