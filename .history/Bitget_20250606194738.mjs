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
          let timestamp = MyKit.timestampToUTC(new Date().getTime() + (-8 * 60 * 60 * 1000) )
          let URL =  BitgetFuture.baseURL + URI + '?' + pathData;
          const params = {
              url: URL,
              method: 'GET',
              timeout: 10 * 1000,
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
              res = await $http.get(URL, {headers: params.headers})
          } catch (error) {
              res = error.response;
              // console.log(error)
          }
          let isSuccess = true
          if(!res || !res.status || !(parseInt(res.status)  == 200)){
              if(res&&res.status&&res.status == 429){
                  this.vue.logError("--- 收到频率过高警告  ---")
              }
              isSuccess = false
          }
          //await MyKit.sleep(100)
          return { state: isSuccess, data:res.data}
      }
}

export default Bitget;