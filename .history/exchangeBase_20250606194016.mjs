import { get, post } from './request.mjs';


class ExchangeBase {
  constructor(name,apiInfo) {
    this.name = name;
  }

   async get(url, params) {
    return get(url, params);
  }

  async post(url, data) {
    return post(url, data);
  }

  
  async getPrice(symbol) {
    throw new Error('Method not implemented: getPrice');
  }
 
}

export default ExchangeBase;