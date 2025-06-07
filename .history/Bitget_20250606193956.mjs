import ExchangeBase from './exchangeBase.mjs';

var baseUrl = 'https://api.bitget.com';

class Bitget extends ExchangeBase {
  constructor(apiInfo) {
    super('Bitget');
  }
  async getPrice(symbol) {
    let response = await this.get(`${baseUrl}/api/mix/v1/market/ticker`, { symbol });
    return parseFloat(response.data.data.last);
  }
}

export default Bitget;