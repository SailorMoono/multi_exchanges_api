import { get, post } from './request.mjs';


class ExchangeBase {
  constructor(name, apiInfo) {
    this.name = name;
    this.apiInfo = apiInfo;
  }
  setApiInfo(apiInfo) {
    this.apiInfo = apiInfo;
  }
  clearBody = (body)=>{
    let rst = {};
    for(let key in body){
        if(body[key] != null){
            rst[key] = body[key];
        }
    }
    return rst;
  }

  symbolConvert(baseSymbol,isFutures = true) {
    return baseSymbol;
  }

  async getPositions(symbol){
    throw new Error('Method not implemented: getPositions');
  }
  closePositionGetProfit(symbol) {  
    throw new Error('Method not implemented: closePositionGetProfit');
  }
  async createOrder(symbol,side,orderType,size,price){
    throw new Error('Method not implemented: createOrder');
  }
  async createOrderMax(symbol,side,orderType,size,price,max) {
    throw new Error('Method not implemented: createOrderMax');
  }
  async getOrderInfo(symbol,orderId) {
    throw new Error('Method not implemented: getOrderInfo');
  }
  async cancelOrder(symbol,orderId){
    throw new Error('Method not implemented: cancelOrder');
  }
  async getBalance(ccy) {
    throw new Error('Method not implemented: getBalance');
  }
  async getKline(symbol,period) {
    throw new Error('Method not implemented: getKline');
  }
  async getPrice(symbol) {
    throw new Error('Method not implemented: getPrice');
  }
  async get(url, params,headers={}) {
    return get(url, params,headers);
  }

  async post(url, data,headers={}) {
    return post(url, data,headers);
  }
  async baseGet(URI,pathData){
    throw new Error('Method not implemented: baseGet');
  }

  async basePost (URI,body) {
    throw new Error('Method not implemented: basePost');
  }

  // 通用的错误处理方法
  async safeExecute(promise, context = '') {
    try {
        const result = await promise;
        return { success: true, data: result };
    } catch (error) {
        console.error(`[${context}] Error:`, error.message); // 只打印简化的错误信息
        return { success: false, error: error.message }; // 返回简化的错误信息
    }
  }

}

export default ExchangeBase;