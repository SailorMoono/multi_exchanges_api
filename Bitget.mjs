import ExchangeBase from './exchangeBase.mjs';
import CryptoJS from 'crypto-js';


var baseUrl = 'https://api.bitget.com';

class Bitget extends ExchangeBase {
  constructor(apiInfo) {
    super('Bitget', apiInfo);
  }
  async getPrice(symbol) {
   // let response = await this.get(`${baseUrl}/api/mix/v1/market/ticker`, { symbol });
    let response = await this.safeExecute(this.get(`${baseUrl}/api/mix/v1/market/ticker`, { symbol }));
    return response;
  }
  async getKline(symbol,period) {
    const URI = `/api/mix/v1/market/candles`
    let start = new Date().getTime() - 1000 * 60 * 60 * 24 * 30
    let end = new Date().getTime()
    let rst = await this.safeExecute(this.get(baseUrl + URI + '?' + `symbol=${symbol}&granularity=${period}&startTime=${start}&endTime=${end}&limit=100`,null));
    return rst;
  }

  symbolConvert(baseSymbol,isFutures = true) {
    let coin01 = baseSymbol.split('_')[0].toUpperCase();
    let coin02 = baseSymbol.split('_')[1].toUpperCase();
    // return isFutures ? `${coin01}${coin02}_UMCBL` : `${coin01}_${coin02}`;
    return isFutures ? `${coin01}${coin02}` : `${coin01}${coin02}`;
  }

  async setLev(symbol,lev){
    const URI = `/api/v2/mix/account/set-leverage`

    let body = {
        symbol,
        leverage:lev,
        productType:"USDT-FUTURES",
        marginCoin:"USDT"
    }
    let rst = await this.basePost(URI,body)
    if(rst.state){
      rst.data = rst.data.data;
    }
    return rst;
  }

  //划转

  async transfer(symbol,type = 1,amount,coin = "USDT") {
    let fromType = "";
    let toType = "";
    if(type == 1){
      fromType = "mix";
      toType = "spot";
    }
    const URI = `/api/spot/v1/wallet/transfer-v2`
    let body = {
        fromType,
        toType,
        amount,
        coin
    }
    let rst = await this.basePost(URI,this.clearBody(body))
    return rst;
  }

  async createOrder(symbol,side,orderType,size,price,leverage) {
      if(size != null){
        size = parseFloat(size).toFixed(0);
      }
      let sides = side.split("_")
      let tside = "buy"
      if(sides[1] == "short"){
        tside = "sell"
      }
      let tradeSide = sides[0]
      const URI = `/api/v2/mix/order/place-order`
      let body = {
        symbol,
        tradeSide,
        side:tside,

        marginCoin:'USDT',
        orderType,
        timeInForceValue:"normal",
        productType:'USDT-FUTURES',
        marginMode:"crossed",
        size,
        price,
      }
      let rst = await this.basePost(URI,this.clearBody(body))
      return rst;
  }

  async createOrderMax(symbol,side,orderType,size,price,max,leverage) {
    if(size != null){
      size = parseFloat(size).toFixed(0);
    }
    let rst = null;
    if(size > max && max > 0){
        let count = Math.ceil(size / max);
        let every = size / count
        every = parseFloat(every).toFixed(0);
        for(let i = 0; i < count;i++){
          try {
            rst = await this.createOrder(symbol,side,orderType,every,price,leverage)
          } catch (error) {
              console.error('Error creating order:', error);
          }
        }
        return rst
    }else{
      rst = await this.createOrder(symbol,side,orderType,size,price,leverage)
    }
    return rst;
}
async getOrderInfo(symbol,orderId) {
    const URI = `/api/v2/mix/order/detail`
    let rst = await this.baseGet(URI,`symbol=${symbol}&orderId=${orderId}&productType=USDT-FUTURES`);
    return rst;
}

async getPositions(symbol) {
    const URI = `/api/v2/mix/position/single-position`
    let rst = await this.baseGet(URI,'symbol=' + symbol + `&marginCoin=USDT&productType=USDT-FUTURES`);
    if(rst.state){
      rst.data = rst.data.data;
    }
    return rst;
}

//完全平仓获取利润
async closePositionGetProfit (symbol,posSide,amount) {
      let pos = await this.getPositions(symbol)
      let orders = []
      // console.log(pos.state)
      if(pos.state){
          pos = pos.data;
          for(let p of pos){
              if(p.available != 0 && (posSide == p.holdSide || posSide.toUpperCase() == "ALL")){
                  let side = "close_short"
                  if(p.holdSide == "long"){
                    side = "close_long"
                  }
                  if(amount && amount > 0 && amount < p.available){
                    let or = await this.createOrder(symbol,side,"market",amount,null,1)
                    orders.push(or)
                  }else{
                    let or = await this.createOrder(symbol,side,"market",p.available,null,1)
                    orders.push(or)
                  }
                 
              }
          }
      }else{
          return 0;
      }
      let profit = 0;
      for(let order of orders){
          for(let i = 0;i <= 20;i++ ){
              let info = await this.getOrderInfo(symbol,order.data.data.orderId)
              if(info.data.data.state == "filled"){
                profit += (parseFloat(info.data.data.totalProfits) + parseFloat(info.data.data.fee) * 2)
                break
              }
          }
      }
    return profit
}


  async getBalance(coin) {
    const URI = `/api/v2/mix/account/accounts`
    let rst = await this.baseGet(URI,`productType=USDT-FUTURES`);
    if(rst.state){
      rst.data = rst.data.data[0];
    }
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

   async basePost (URI,body) {
      const timestamp = Date.now();
      const params = {
          url: baseUrl + URI,
          method: 'POST',
          timeout: 10 * 1000,
          headers: {
              'ACCESS-KEY': this.apiInfo.apiKey,
              'ACCESS-SIGN':this.encrypt(timestamp + 'POST' + URI + JSON.stringify(body),this.apiInfo.secretKey),
              'ACCESS-TIMESTAMP':timestamp,
              'ACCESS-PASSPHRASE':this.apiInfo.passphrase,
              'Content-Type': 'application/json',
          },
          data:body
      }
      return this.safeExecute(this.post(params.url, params.data, params.headers), 'basePost');
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
        let isSuccess = true
        if(!result || !result.status || !(parseInt(result.status)  == 200)){
          if(result && result.status && result.status == 429){
            console.log("--- 收到频率过高警告  ---")
          }
        isSuccess = false
        }
        return { state: isSuccess, data: result.data };
      } catch (error) {
        console.error(`[${context}] Error:`, error.message);
        return { state: false, error: error.message };
      }
  }
}

export default Bitget;