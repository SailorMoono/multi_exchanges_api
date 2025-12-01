const axios = require('axios-https-proxy-fix')
const MyKit = require('../kit/MyKit')
const config = require('../config')
const MyLog = require('../kit/MyLog')


const TYPE = {     
    MARKET:"MARKET",
    LIMIT:"LIMIT",
    STOP_MARKET:"STOP_MARKET",
    STOP:"STOP"
}

const POSITIONSIDE = {
    LONG:"LONG",
    SHORT:"SHORT"
}
const SIDE = {
    BUY:"BUY",
    SELL:"SELL"
}
const TIMEINFORCE = {
    GTC:"GTC"
}



const isDev = config.isDev;
const opts = {}

if (isDev) {
    opts.host = config.proxy.host
    opts.port =  config.proxy.port
}

const Binance_spot = {}

Binance_spot.baseURL = 'https://fapi.binance.com'

//清除body中的null字段
Binance_spot.clearBody = (body)=>{
    let rst = {};
    for(key in body){
        if(body[key] != null){
            rst[key] = body[key];
        }
    }
    return rst;
}

//获取币对信息
Binance_spot.getSymbolInfo = async function(_symbol){
    const URI = `/fapi/v1/exchangeInfo`;
    let rst =  await Binance_spot.baseGet(URI,'symbol=' + _symbol);
    for(let symbol of rst.data.symbols){
        if(symbol.symbol == _symbol){
            for(let filter of symbol.filters){
                if(filter.filterType == "LOT_SIZE"){
                    let str = '';
                    str = filter.minQty.split('.')[1]; 
                    if(str){
                        symbol.amountPrecision = str.length;
                    }else{
                        symbol.amountPrecision = 0;
                    }
                    
                }
                if(filter.filterType == "PRICE_FILTER"){
                    let str = '';
                    str = parseFloat( filter.tickSize) + '';
                    str = str.split('.')[1]; 
                    if(str){
                        symbol.pricePrecision = str.length;
                    }else{
                        symbol.pricePrecision = 1;
                    }
                }
            }
            return symbol;
        }
    } 
}

//计算该币对持仓利润
Binance_spot.calcNowProfit = async function (symbol) {
    let positions = await Binance_spot.getPositions(symbol);
    let longProfit = 0;
    let shortProfit = 0;
    let longInitMargin = 0;
    let shortInitMargin = 0;
    for(let position of positions){
        if(position.positionSide == POSITIONSIDE.LONG){
            //获取利润
            longProfit += parseFloat(position.unrealizedProfit);
            //保证金
            longInitMargin += parseFloat(position.positionInitialMargin);
        }else{
            shortProfit += parseFloat(position.unrealizedProfit);
            shortInitMargin += parseFloat(position.positionInitialMargin);
        }
    }
    return {
        longProfit,
        shortProfit,
        longInitMargin,
        shortInitMargin
    };
}


//完全平仓
Binance_spot.closePositions = async function (symbol) {
    let positions = await Binance_spot.getPositions(symbol);
    for(let position of positions){
        if(position.positionSide == "LONG"){
            await Binance_spot.createOrder(symbol,null,position.positionAmt,"SELL","LONG","MARKET",null,null);
        }else{
            await Binance_spot.createOrder(symbol,null,parseFloat(position.positionAmt) * -1,SIDE.BUY,POSITIONSIDE.SHORT,"MARKET",null,null);
        }
    }
    return true;
}

Binance_spot.listTradingOrder = async (symbol) => {
    const URI = `/fapi/v1/openOrders`;
   
    return await (await Binance_spot.baseGet(URI,'symbol=' + symbol)).data;
}

//更改持仓模式
Binance_spot.changeModle = async (modle) => {
    const URI = `/fapi/v1/positionSide/dual`;
    let body = {
        dualSidePosition:modle,
        timestamp:new Date().getTime(),
    }
    return await Binance_spot.basePost(URI,body);
}

//获取订单信息
Binance_spot.getOrderInfo = async (symbol,orderId) => {
    const URI = `/fapi/v1/order`;
   
    return await Binance_spot.baseGet(URI,'symbol=' + symbol + '&' + 'orderId=' + orderId);
}

//获取余额
Binance_spot.getBalance = async (asset) => {
    const URI = `/fapi/v2/balance`;
    let rst = await Binance_spot.baseGet(URI,'symbol=' + asset);
    for(let b of rst.data){
        if(b.asset == asset){
            return b;
        }
    }
    return rst;
}

//撤销订单
Binance_spot.cancelOrder = async function (symbol,orderId) {
    const URI = `/fapi/v1/order`
    let body = {
        symbol:symbol,
        orderId:orderId,
        timestamp:new Date().getTime(),
    }
    return await Binance_spot.baseDelete(URI,body);
}

//撤销所有订单
Binance_spot.cancelALLOrder = async function (symbol) {
    const URI = `/fapi/v1/allOpenOrders`
    let body = {
        symbol:symbol,
        timestamp:new Date().getTime(),
    }
    return await Binance_spot.baseDelete(URI,body);
}

//开仓
Binance_spot.createOrder = async function (symbol,price,quantity,side,posSide,type,timeInForce,stopPrice) {
    let symbolInfo =  await Binance_spot.getSymbolInfo(symbol);
    let pricePrecision = symbolInfo.pricePrecision;
    let amountPrecision = symbolInfo.amountPrecision;
    if(price != null){
        price = parseFloat(price).toFixed(pricePrecision);
    }
    if(stopPrice !=null){
        stopPrice = parseFloat(stopPrice).toFixed(pricePrecision)
    }
    if(quantity != null){
        quantity = parseFloat(quantity).toFixed(amountPrecision);
    }
    MyLog.log('DEBUG',`-----------created order----side : ${side}----Type:${type}------ pos-side : ${posSide}---quantity:${quantity}----------`);
    const URI = `/fapi/v1/order`
    let body = {
        symbol:symbol,
        side:side,
        positionSide:posSide,
        type:type,
        quantity:quantity,
        price:price,
        timeInForce:timeInForce,
        timestamp:new Date().getTime(),
        stopPrice:stopPrice
    }
    body = Binance_spot.clearBody(body);
    MyLog.log('INFO',body);
    let rst = await Binance_spot.basePost(URI,body);
    return rst.data;
}

//获取当前持仓
Binance_spot.getPositions = async (symbol) => {
    const URI = `/fapi/v2/account`;
    let rst = await Binance_spot.baseGet(URI, 'symbol=' + symbol);
    let positions = [];
    for(let p of rst.data.positions){
        if(p.symbol == symbol && p.positionAmt != 0){
            positions.push(p);
        }
    }
    return positions;
}
//获取最新价格
Binance_spot.getPrice = async function(symbol){
    const URI = `/fapi/v1/ticker/price`;
    let rst = await Binance_spot.baseGet(URI,'symbol=' + symbol);
    return rst.data.price;
}

//获取最新价格
Binance_spot.getBookTicker = async function(symbol){
    const URI = `/fapi/v1/ticker/bookTicker`;
    let rst = await Binance_spot.baseGet(URI,'symbol=' + symbol);
    return rst.data;
}

//获取k线数据
Binance_spot.getKLine = async function(symbol,interval,limit){
    const URI = `/fapi/v1/klines`;
    let rst = await Binance_spot.baseGet(URI,'symbol=' + symbol + '&' + 'interval=' + interval + '&' + 'limit=' + limit);
    return rst.data;
}

//基础post
Binance_spot.basePost = async (URI,body) => {
    body.recvWindow = '10000000';
    var toBodyStr = '';
    var count = 0;
    for(let key in body){
        if(count == 0){
            toBodyStr = key + '=' + body[key];
            count ++;
        }else{
            toBodyStr = toBodyStr + "&" + key + '=' + body[key];
        }
    }
    let sign = MyKit.crypBiance(toBodyStr,config.api.SecretKey);
    const params = {
        url: Binance_spot.baseURL + URI + '?' + toBodyStr + `&signature=${sign}`,
        method: 'POST',
        timeout: 10 * 1000,
        headers: {
            'X-MBX-APIKEY': config.api.APIKey,
            'Content-Type': 'application/json',
        }
    }
    
    if (isDev) params.proxy = JSON.parse(JSON.stringify(opts))
   
    // const rst = await axios(params)
    // console.log(rst)

    const rst = await axios(params).catch(error => Promise.reject({
        state: false, data: { msg: error.response.data.msg + ''}}))
    //await MyKit.sleep(1000);
    return { state: true, data:rst.data }
}

//基础get
Binance_spot.baseGet = async (URI,pathData) => {
    let timestamp = new Date().getTime();
    let timeStr = `&timestamp=${timestamp}&recvWindow=10000000`;
    let URL =  Binance_spot.baseURL + URI + '?' + pathData + timeStr;
    let sign = MyKit.crypBiance(pathData + timeStr,config.api.SecretKey);
    URL = URL + `&signature=${sign}`;
    //console.log(URL)
    const params = {
        url: URL,
        method: 'GET',
        timeout: 10 * 1000,
        headers: {
            'X-MBX-APIKEY': config.api.APIKey,
            'Content-Type': 'application/json',
        }
    }
    
    if (isDev) params.proxy = JSON.parse(JSON.stringify(opts))

    // const rst = await axios(params)
    // console.log(rst)
    const rst = await axios(params).catch(error => Promise.reject({
        state: false, data: { msg: error.response.data.msg + '' } }))
    //await MyKit.sleep(1000);
    return { state: true, data:rst.data }
}
//基础delete
Binance_spot.baseDelete = async (URI,body) => {
    var toBodyStr = '';
    var count = 0;
    body.recvWindow = '10000000';
    for(let key in body){
        if(count == 0){
            toBodyStr = key + '=' + body[key];
            count ++;
        }else{
            toBodyStr = toBodyStr + "&" + key + '=' + body[key];
        }
    }
    let sign = MyKit.crypBiance(toBodyStr,config.api.SecretKey);
    const params = {
        url: Binance_spot.baseURL + URI + '?' + toBodyStr + `&signature=${sign}`,
        method: 'DELETE',
        timeout: 10 * 1000,
        headers: {
            'X-MBX-APIKEY': config.api.APIKey,
            'Content-Type': 'application/json',
        }
    }
    
    if (isDev) params.proxy = JSON.parse(JSON.stringify(opts))
   
    // const rst = await axios(params)
    // console.log(rst)

    const rst = await axios(params).catch(error => Promise.reject({
        state: false, data: { msg: error.response.data.msg + ''}}))
    //await MyKit.sleep(1000);
    return { state: true, data:rst.data }
}

module.exports = Binance_spot
