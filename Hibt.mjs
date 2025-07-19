import ExchangeBase from './exchangeBase.mjs';
import CryptoJS from 'crypto-js';
import MyKit from './tools/MyKit.mjs';


var baseUrl = 'https://fapi.hibt0.com/open-api';

class Hibt extends ExchangeBase {
  constructor(apiInfo) {
    super('Hibt', apiInfo);
  }
  async getPrice(symbol) {
    console.log('getPrice', symbol);
   // let response = await this.get(`${baseUrl}/api/mix/v1/market/ticker`, { symbol });
    let response = await this.safeExecute(this.get(`${baseUrl}/v2/market/index`, { symbol }));
    //console.log('getPrice response', response.data.data[0]);
    response.data = response.data.data[0].marketPrice;
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
    return isFutures ? `${coin01.toLowerCase()}_${coin02.toLowerCase()}` : `${coin01}_${coin02}`;
  }

  async setLev(symbol, lev) {
    const URI = `/v2/account/setLeverage`
    const body = {
      symbol,
      leverage: lev,
      timestamp: Date.now()
    }

    const rst = await this.basePost(URI, body)
  // console.log(rst)
    if (rst.state) {
      rst.data = rst.data.data
    }

    return rst
  }



  async createOrder(symbol,side,orderType,size,price,leverage) {

      if(!leverage){
        leverage = 1;
      }
      if(side == "open_long" || side == "open_short"){
        let type = 1;
        let open = 1; // 1:买入, 2:卖出
        if(side == "open_short"){
          open = 2;
        }
       
        // if(size != null){
        //   size = parseFloat(size).toFixed(0);
        // }
        if(orderType == "market"){
          if(!price){
            price = 0.01;
          }
          type = 2;
        }
        const URI = `/v2/order/open`
        let body = {
            customID: "HIBT_" + Date.now(),
            symbol,
            side:open,
            type,
            leverage: leverage,
            isSetSp: false, //是否止盈
            isSetSl: false, //是否止损
            amount: size + "",
            price: price + "",
           // timestamp: Date.now()
        }
        console.log('createOrder body:', body)

        let rst = await this.basePost(URI,this.clearBody(body))
        if(rst.state){
          rst.data = rst.data.data;
        }
        return rst;

        //当前只实现了一键全平
      }else if(side == "close_long" || side == "close_short" || side == "close_all"){
       
        const URI = `/v2/order/closeAll`
        let body = {
            symbol,
            timestamp: Date.now()
        }
        let rst = await this.basePost(URI,this.clearBody(body))
         if(rst.state){
          console.log('createOrder closeAll response:', rst)
          rst.data = rst.data.data;
          if(!rst.data.listOrderID){
            rst.data.listOrderID = [];
          }
          if(rst.data.listOrderID.length > 0){
            rst.data.orderId = rst.data.listOrderID[0];
          }
        }
        return rst;
      }

      
  }

  async createOrderMax(symbol,side,orderType,size,price,max,leverage) {
    if(size != null){
      size = parseFloat(size).toFixed(0);
    }
    let rst = null;
    if(size > max && max > 0){
        let count = Math.ceil(size/ max);
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
    const URI = `/v2/order/finishedInfo`
    let params = {
      orderID: orderId,
       timestamp: Date.now()
    }
    let rst = await this.baseGet(URI,params);
    if(rst.state){
      rst.data = rst.data.data;
    }
    return rst;
}

async getPositions(symbol) {
    const URI = `/v2/account/position`
    let params = {
      symbol,
    }
    let rst = await this.baseGet(URI,params);
    //console.log('getPositions response:', rst.data)
    if(rst.state){
      rst.data = rst.data.data;
      for(let p of rst.data){
        p.holdSide = p.side == 0 ? "long" : "short";
        p.available = parseFloat(p.amount);
      }
    }
    return rst;
}

//完全平仓获取利润
async closePositionGetProfit (symbol,posSide) {
      let pos = await this.getPositions(symbol)
      let orders = []
      // console.log(pos.state)
      if(pos.state){
          pos = pos.data;
          console.log('closePositionGetProfit pos:', pos)
          for(let p of pos){
              if(p.available != 0 && (posSide.toUpperCase() == p.holdSide.toUpperCase() || posSide.toUpperCase() == "ALL")){
                  let side = "close_short"
                  if(p.holdSide == "long"){
                      side = "close_long"
                  }
                  let or = await this.createOrder(symbol,side,"market",p.available,null)
                  orders.push(or)
              }
          }
      }else{
          return 0;
      }
      let profit = 0;
      for(let order of orders){
        let info;
          for(let i = 0;i <= 20;i++ ){
              info = await this.getOrderInfo(symbol,order.data.orderId)
              //console.log('closePositionGetProfit info:', info)
              if(info.data.state == 2 || info.data.state == 1 && i >= 2){
                break
              }
              await MyKit.sleep(100)
          }
          profit += (parseFloat(info.data.profit) - parseFloat(info.data.fee) * 2)
      }
    return profit
}


 async getBalance(coin) {
  const URI = `/v2/account/balance`
  const pathData = {}

  let rst = await this.baseGet(URI, pathData)
  let source = rst
 // console.log('getBalance response:', rst.data)
  if (rst.state) {
    let newdata = {}
    newdata.available = parseFloat(source.data.data.balance)
    rst.data = newdata
  }

  return rst
}

async baseGet(URI, pathData) {
  const timestamp = Date.now()
  pathData.reqTime = timestamp
 

  const queryString = Object.keys(pathData)
    .sort()
    .map(key => `${key}=${pathData[key]}`)
    .join('&')
  //console.log('baseGet queryString:', queryString)
  const URL = baseUrl + URI + (queryString ? '?' + queryString : '')
 // console.log('baseGet URL:', URL)
  const signStr = (queryString ? queryString : '')
 // console.log('baseGet signStr:', signStr)
  const headers = {
    'X-ACCESS-KEY': this.apiInfo.apiKey,
    'X-SIGNATURE': this.encrypt(signStr, this.apiInfo.secretKey),
    'X-TIMESTAMP': timestamp,
    'Content-Type': 'application/json'
  }

  return this.safeExecute(this.get(URL, null, headers), 'baseGet')
}




async basePost(URI, body) {
  const timestamp = Date.now()
  body.timestamp = timestamp // HIBT 要求 body 里要有 timestamp 字段

  const sortedBody = this.sortAndSerialize(body)

  const kvPairs = []
  for (const key of Object.keys(sortedBody)) {
    let value = sortedBody[key]
    if (Array.isArray(value)) {
      value = JSON.stringify(value)
    }
    kvPairs.push(`${key}=${value}`)
  }

  const signStr = kvPairs.join('&')
  //console.log('basePost signStr:', signStr)
 // console.log('签名串:', signStr)

  const signature = this.encrypt(signStr, this.apiInfo.secretKey)

  const headers = {
    'X-ACCESS-KEY': this.apiInfo.apiKey,
    'X-TIMESTAMP': timestamp.toString(),
    'X-SIGNATURE': signature,
    'Content-Type': 'application/json'
  }

  return this.safeExecute(this.post(baseUrl + URI, body, headers), 'basePost')
}

sortAndSerialize(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => this.sortAndSerialize(item))
  } else if (typeof obj === 'object' && obj !== null) {
    const sorted = {}
    Object.keys(obj).sort().forEach(key => {
      if (obj[key] !== '') {
        sorted[key] = this.sortAndSerialize(obj[key])
      }
    })
    return sorted
  }
  return obj
}

encrypt(crypData,secretKey){

    return  CryptoJS.HmacSHA256(crypData, secretKey).toString(CryptoJS.enc.Hex)
}
  
//   function signParams(params, secret) {
//   const str = Object.keys(params)
//     .sort()
//     .map(key => `${key}=${params[key]}`)
//     .join('&')
//   return crypto
//     .createHmac('sha256', secret)
//     .update(str)
//     .digest('hex')
// }
  async safeExecute(promise, context = '') {
      try {
        const result = await promise;
        let isSuccess = true
        //console.log(result.data)
        if(!result || !result.data || !(parseInt(result.data.code)  == 0)){
          if(result && result.data && result.data.code == 220017){
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

export default Hibt;