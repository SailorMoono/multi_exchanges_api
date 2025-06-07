import { get, post } from './request.mjs';


class ExchangeBase {
  constructor(name) {
    this.name = name;
  }

  
  async getPriceInfo(symbol) {
      throw new Error('Method not implemented: getPriceInfo');
  }
 
}

export default ExchangeBase;