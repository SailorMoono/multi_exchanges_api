import ExchangeBase from './exchangeBase.mjs';
import CryptoJS from 'crypto-js';


var baseUrl = 'https://www.okx.com';

class Okx extends ExchangeBase {
  constructor(apiInfo) {
    super('Okx', apiInfo);
  }
  async getPrice(symbol) {
    let response = await this.get(`${baseUrl}/api/v5/market/ticker`, { instId:symbol });
    return parseFloat(response.data.data.last);
  }
  async getKline(symbol,period) {
    const URI = `/api/v5/market/candles`
    let rst = await this.get(baseUrl + URI + '?' + `instId=${symbol}&bar=${period}&limit=100`,null);
    return rst;
  }

  async getBalance(coin) {
      const URI = `/api/v5/account/balance`
      let rst = await this.baseGet(URI,`ccy=${coin}`);
      return rst;
  }

  async baseGet(URI,pathData){
    const timestamp = Date.now();
    let URL =  baseUrl + URI + '?' + pathData;
    const params = {
        url: URL,
        method: 'GET',
        timeout: 5 * 1000,
        headers: {
            'ACCESS-KEY': this.apiInfo.apiKey,
            'ACCESS-SIGN':this.encrypt(timestamp + 'GET' +  URI + '?' + pathData,this.apiInfo.secretKey),
            'ACCESS-TIMESTAMP':timestamp,
            'ACCESS-PASSPHRASE':this.apiInfo.passphrase,
            'Content-Type': 'application/json',
            'locale':'zh-CN',
        }
    }
    let res = null
    try {
        res = await this.get(URL,null, params.headers)
    } catch (error) {
        res = error.response;
        // console.log(error)
    }
    let isSuccess = true
    if(!res || !res.status || !(parseInt(res.status)  == 200)){
        if(res&&res.status&&res.status == 429){
          console.log("--- 收到频率过高警告  ---")
        }
        isSuccess = false
    }
    return { state: isSuccess, data:res.data}
  }
  encrypt(crypData,secretKey){
      //  console.log(crypData + ' ' + secretKey);
    const cryped = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(crypData, secretKey));
        //console.log(cryped)
    return cryped;
  }
}

export default Okx;