import ExchangeBase from './exchangeBase.mjs';
import { get } from './request.mjs';

var baseUrl = 'https://api.bitget.com';

class Bitget extends ExchangeBase {
  constructor() {
    super('Bitget');
  }

  async getPrice(symbol) {
    return await get(`${baseUrl}/api/mix/v1/market/ticker`, { symbol }, null).data;
  }
}

export default Bitget;