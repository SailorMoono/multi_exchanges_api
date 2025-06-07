import ExchangeBase from './exchangeBase.mjs';
import { get } from './request.mjs';

var baseUrl = 'https://api.bitget.com';

class Bitget extends ExchangeBase {
  constructor() {
    super('Bitget');
  }

  async getSymbolAndUpMapping() {
    // 这里是 Bitget 特有的实现
    console.log('Fetching symbol and up mapping for Bitget...' + this.name);
    return await get('www.baidu.com',null,null).data;
  }
}

export default Bitget;