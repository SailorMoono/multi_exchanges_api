import ExchangeBase from './exchangeBase.mjs';
import { get } from './request.mjs';

var baseUrl = 'https://api.bitget.com';

class Bitget extends ExchangeBase {
  constructor() {
    super('Bitget');
  }

  async getPrice() {
    // 这里是 Bitget 特有的实现
    console.log('Fetching price for Bitget...' + this.name);
    return await get(`${baseUrl}/api/mix/v1/market/ticker`, null, null).data;
  }
}

export default Bitget;