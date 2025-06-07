import ExchangeBase from './exchangeBase.mjs';
import CryptoJS from 'crypto-js';


var baseUrl = 'https://www.okx.com';

class Okx extends ExchangeBase {
  constructor(apiInfo) {
    super('Okx', apiInfo);
  }
  async getPrice(symbol) {
   // let response = await this.get(`${baseUrl}/api/v5/market/ticker`, { instId:symbol });
   let response = await this.safeExecute(this.get(`${baseUrl}/api/v5/market/ticker`, { instId:symbol }), 'getPrice');
   return response;
    // if (!response.success) {
    //   throw new Error(`Failed to get price for ${symbol}: ${response.error}`);
    // }
    // return parseFloat(response.data.data.last);
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
    return this.safeExecute(this.get(URL, null, params.headers), 'baseGet');
  }

  //基础post
  async basePost (URI,body) {
      const timestamp = Date.now();
      const params = {
          url: OkexFuture.baseURL + URI,
          method: 'POST',
          timeout: 10 * 1000,
          headers: {
              'OK-ACCESS-KEY': this.apiKey,
              'OK-ACCESS-SIGN':MyKit.crypOkex(timestamp + 'POST' + URI + JSON.stringify(body),this.secretKey),
              'OK-ACCESS-TIMESTAMP':timestamp,
              'OK-ACCESS-PASSPHRASE':this.passphrase,
              'Content-Type': 'application/json',
          },
          data:body
      }
      return this.safeExecute(this.post(Okx.baseUrl + URI, body, params.headers), 'basePost');
    }

  encrypt(crypData,secretKey){
      //  console.log(crypData + ' ' + secretKey);
    const cryped = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(crypData, secretKey));
        //console.log(cryped)
    return cryped;
  }
  async safeExecute(promise, context = '') {
      try {
        const result = await promise;
        if(!result || !result.status || !(parseInt(result.status)  == 200)){
          if(result && result.status && result.status == 429){
            console.log("--- 收到频率过高警告  ---")
          }
        isSuccess = false
        }
        return { success: true, data: result };
      } catch (error) {
        console.error(`[${context}] Error:`, error.message);
        return { success: false, error: error.message }; 
      }
  }
}

export default Okx;