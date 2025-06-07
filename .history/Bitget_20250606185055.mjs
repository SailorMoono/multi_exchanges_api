import ExchangeBase from './exchangeBase.mjs';
//import { get } from './request.mjs';

var baseUrl = 'https://api.bitget.com';

class Bitget extends ExchangeBase {
  constructor() {
    super('Bitget');
  }
  async getPrice(symbol) {
    let response = await get(`${baseUrl}/api/mix/v1/market/ticker`, { symbol }, null);
    return parseFloat(response.data.data.last);
  }
}

export default Bitget;