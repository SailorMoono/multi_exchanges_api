import { get, post } from './request.mjs';


class ExchangeBase {
  constructor(name, apiInfo) {
    this.name = name;
    this.apiInfo = apiInfo;
  }

   async get(url, params) {
    return get(url, params);
  }

  async post(url, data) {
    return post(url, data);
  }
  async baseGet(URI,pathData){
    throw new Error('Method not implemented: baseGet');
  }

  async getPrice(symbol) {
    throw new Error('Method not implemented: getPrice');
  }
 
}

export default ExchangeBase;