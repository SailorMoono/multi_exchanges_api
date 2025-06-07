import ExchangeBase from './exchangeBase.mjs';

var baseUrl = 'https://api.bitget.com';

class Bitget extends ExchangeBase {
  constructor(apiInfo) {
    super('Bitget', apiInfo);
  }
  async getPrice(symbol) {
    let response = await this.get(`${baseUrl}/api/mix/v1/market/ticker`, { symbol });
    return parseFloat(response.data.data.last);
  }

  async baseGet(URI,pathData){
    const timestamp = Date.now();
    let URL =  BitgetFuture.baseURL + URI + '?' + pathData;
    const params = {
        url: URL,
        method: 'GET',
        timeout: 5 * 1000,
        headers: {
            'ACCESS-KEY': this.apiKey,
            'ACCESS-SIGN':MyKit.crypOkex(timestamp + 'GET' +  URI + '?' + pathData,this.secretKey),
            'ACCESS-TIMESTAMP':timestamp,
            'ACCESS-PASSPHRASE':this.passphrase,
            'Content-Type': 'application/json',
            'locale':'zh-CN',
        }
    }
    let res = null
    try {
        res = await this.get(URL, {headers: params.headers})
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
  crypOkex(crypData,secretKey){
        // console.log(crypData);
    const cryped = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(crypData, secretKey));
        //console.log(cryped)
    return cryped;
  }
}

export default Bitget;