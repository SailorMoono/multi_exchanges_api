import { get, post } from './request.mjs';


class ExchangeBase {
  constructor(name) {
    this.name = name;
  }

  async getSymbolAndUpMapping(){
    throw new Error('Method not implemented: getFundingRate');
  }
   async getPriceInfo(symbol) {
        throw new Error('Method not implemented: getPriceInfo');
    }
 
}

export default ExchangeBase;