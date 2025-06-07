
import request from '../kit/request.js'
const MyKit = require('../kit/MyKit.js')
const $http = require('axios-https-proxy-fix')

//const isDev = process.env.NODE_ENV === 'development'
const isDev = false


class BitgetFuture {
    constructor(name, apiKey, secretKey, passphrase) {
        this.name = name
        this.apiKey = apiKey
        this.secretKey = secretKey
        this.passphrase = passphrase
        this.vue = null
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

    async getBalance(ccy) {
        const URI = `/api/mix/v1/account/accounts`
        let rst = await this.baseGet(URI,`productType=umcbl`);
        if(rst.state){
            for(let as of rst.data.data){
                if(as.marginCoin == ccy){
                    rst.data = as
                }
            }
        }
        return rst;
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

    //基础post
    async basePost (URI,body) {
        let timestamp = MyKit.timestampToUTC(new Date().getTime() + (-8 * 60 * 60 * 1000) )
        const params = {
            url: BitgetFuture.baseURL + URI,
            method: 'POST',
            timeout: 10 * 1000,
            headers: {
                'ACCESS-KEY': this.apiKey,
                'ACCESS-SIGN':MyKit.crypOkex(timestamp + 'POST' + URI + JSON.stringify(body),this.secretKey),
                'ACCESS-TIMESTAMP':timestamp,
                'ACCESS-PASSPHRASE':this.passphrase,
                'Content-Type': 'application/json',
                'locale':'zh-CN',
            },
            data:body
        }

        let res = null
        try {
            res = await $http.post(params.url, params.data,{headers: params.headers})
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

    //设置杠杆
    async setLev(symbol,lev){
        const URI = `/api/mix/v1/account/setLeverage`

        let body = {
            symbol,
            leverage:lev,
            marginCoin:"USDT"
        }
        let rst = await this.basePost(URI,body)
        await this.sendLev(symbol,lev)
        return rst;

    }

    //设置保证金模式
    async setMarginMode(symbol,marginMode){
        const URI = `/api/mix/v1/account/setMarginMode`

        let body = {
            symbol,
            marginMode,
            marginCoin:"USDT"
        }
        let rst = await this.basePost(URI,body)
        return rst;

    }

    async sendLev(symbol,lev){
        await this.sendMsg({symbol,lev,side:"setLev"})
    }
    //let amount = await this.getAmount(init,message.amount,message.price,message.lev,message.cs)
    async sendOpen(symbol,price,lev,amount,side,cs,amax){
        await this.sendMsg({symbol,lev,side,amount,cs,price,amax})
    }

    async sendClose(symbol,side){
        await this.sendMsg({symbol,side})
    }

    async sendMsg(data){
        // return null
        if(!this.vue||!this.vue.isSend){
            return
        }
        let res = await $http.post(BitgetFuture.baseBack + "/new", data)
        return res
    }
    

   //获取k线信息
    async getKline(symbol,cycle) {
        const URI = `/api/mix/v1/market/candles`
        let start = new Date().getTime() - 1000 * 60 * 60 * 48
        let end = new Date().getTime()
        let rst = await this.baseGet(URI,`symbol=${symbol}&granularity=${cycle}&startTime=${start}&endTime=${end}&limit=100`);
        return rst;
    }

    async getPriceInfo(symbol) {
        const URI = `/api/mix/v1/market/ticker`
        let rst = await this.baseGet(URI,`symbol=${symbol}`);
        return rst;
    }
    async getAllPrice(type="umcbl") {
        const URI = `/api/mix/v1/market/tickers`
        let rst = await this.baseGet(URI,`productType=${type}`);
        return rst;
    }

    async createOrder(symbol,side,orderType,size,price) {
        // if(px != null){
        //     px = parseFloat(px).toFixed(4);
        // }
        if(size != null){
            size = parseFloat(size).toFixed(0);
        }
        const URI = `/api/mix/v1/order/placeOrder`
        let body = {
            symbol,
            side:side,
            marginCoin:'USDT',
            orderType,
            timeInForceValue:"normal",
            size,
            price,
        }
        let rst = await this.basePost(URI,this.clearBody(body))
        return rst;
    }

    async getOrderInfo(symbol,orderId) {
        const URI = `/api/mix/v1/order/detail`
        let rst = await this.baseGet(URI,`symbol=${symbol}&orderId=${orderId}`);
        return rst;
    }

    async createOrderLimit(symbol,side,orderType,size,price,max) {
        // if(px != null){
        //     px = parseFloat(px).toFixed(4);
        // }

        if(size != null){
            size = parseFloat(size).toFixed(0);
        }
        let rst = null;
        if(size > max && max > 0){
            let count = Math.ceil(size/ max);
            let every = size / count
            every = parseFloat(every).toFixed(0);
            for(let i = 0; i < count;i++){
                // console.log(`${count} - ${every}`)
                try {
                    rst = await this.createOrder(symbol,side,orderType,every,price)
                } catch (error) {
                    
                }
                
            }
            return rst
        }else{
            rst = await this.createOrder(symbol,side,orderType,size,price)
        }
        
        return rst;
    }

    createOrderBody(symbol,tdMode,side,posSide,ordType,num,px,tpTriggerPx,tpOrdPx,slTriggerPx,slOrdPx) {
        if(num != null){
            num = parseFloat(num).toFixed(0);
        }
        let body = {
            instId:symbol,
            tdMode:tdMode,
            side:side,
            ccy:'USDT',
            posSide:posSide,
            ordType:ordType,
            sz:num,
            px:px,
            tpTriggerPx,
            tpOrdPx,
            slTriggerPx,
            slOrdPx,
            // tag:this.vue.bCode
        }
        return this.clearBody(body);
    }
    
    async createMultiOrder(orderList) {
        
        const URI = `/api/v5/trade/batch-orders`
        let body = orderList
        let rst = await this.basePost(URI,body)
        return rst;
    }

    async createAlgoOrder(symbol,side,posSide,ordType,num,tpTriggerPx,tpOrdPx,slTriggerPx,slOrdPx) {

        if(num != null){
            num = parseFloat(num).toFixed(0);
        }
        const URI = `/api/v5/trade/order-algo`
        let body = {
            instId:symbol,
            tdMode:'cross',
            side:side,
            posSide:posSide,
            ordType:ordType,
            sz:num,
            tpTriggerPx,
            tpOrdPx,
            slTriggerPx,
            slOrdPx,
        }
        let rst = await this.basePost(URI,this.clearBody(body))
        return rst;
    }

    async createAlgoOrderAllClose(symbol,side,posSide,ordType,num,tpTriggerPx,tpOrdPx,slTriggerPx,slOrdPx) {
        const URI = `/api/v5/trade/order-algo`
        let body = {
            instId:symbol,
            tdMode:'cross',
            side:side,
            posSide:posSide,
            ordType:ordType,
            // sz:num,
            closeFraction:1,
            tpTriggerPx,
            tpOrdPx,
            slTriggerPx,
            slOrdPx,
        }
        let rst = await this.basePost(URI,this.clearBody(body))
        return rst;
    }

    //修改策略单
    async changeAlgoOrder(symbol,algoId,newSz,newTpTriggerPx,newTpOrdPx,newSlTriggerPx,newSlOrdPx) {
        const URI = `/api/v5/trade/amend-algos`
        let body = {
            instId:symbol,
            algoId,
            newSz,
            newTpTriggerPx,
            newTpOrdPx,
            newSlTriggerPx,
            newSlOrdPx
        }
        let rst = await this.basePost(URI,this.clearBody(body))
        return rst;
    }
    //获取策略订单
    async getAlgoOrderInfo(orderId){
        const URI = `/api/v5/trade/order-algo`
        
        let rst = await this.baseGet(URI, 'algoId=' + orderId);
        return rst;
    }
    //撤销策略单
    async cancelAlgoOrder(symbol,algoId){
        const URI = `/api/v5/trade/cancel-algos`;

        let body = [{
            instId:symbol,
            algoId:algoId
        }]
        return await this.basePost(URI,body);
    }

    //张币转换
    async convert(symbol,type,sz,px){
        const URI = `/api/v5/public/convert-contract-coin`
        
        let rst = await this.baseGet(URI,'instId=' + symbol + '&' + 'type=' + type + '&' + 'sz=' + sz + '&' + 'px=' + px + '&' + 'unit=usds');
        return rst;
}

    async getPositions(symbol) {
        const URI = `/api/mix/v1/position/singlePosition-v2`
        let rst = await this.baseGet(URI,'symbol=' + symbol + `&marginCoin=USDT`)
        return rst;
    }

    //获取未成交订单信息
    async listPendingOrders(symbol){
        const URI = `/api/v5/trade/orders-pending`
        
        let rst = await this.baseGet(URI,'instId=' + symbol);
        return rst;
    }
    //获取未成交策略订单信息
    async listAlgoPendingOrders(symbol){
        const URI = `/api/v5/trade/orders-algo-pending`
        
        let rst = await this.baseGet(URI,'instId=' + symbol+ '&' + 'ordType=conditional');
        return rst;
    }

    //撤销指定币对订单
    async cancelALLOrder(symbol){
        const URI = `/api/mix/v1/order/cancel-symbol-orders`;

        let body = {
            symbol,
            marginCoin:"USDT"
        }
        return await this.basePost(URI,body);
    }
    //撤销订单
    async cancelOrder(symbol,ordId){
        const URI = `/api/v5/trade/cancel-order`;

        let body = {
            instId:symbol,
            ordId
        }
        return await this.basePost(URI,body);
    }

    // //撤销全部
    // async cancelALLOrder(symbol) {
    //     let orders = await this.listPendingOrders(symbol);
    //     orders = orders.data.data
    //     for(let or of orders){
    //         await this.cancelOrder(symbol,or.ordId);
    //     }
    //     return true;
    // }

    //撤销全部策略
    async cancelALLAlgoOrder(symbol) {
        let orders = await this.listAlgoPendingOrders(symbol);
        
        orders = orders.data
        for(let or of orders){
            console.log(or.algoId)
            await this.cancelAlgoOrder(symbol,or.algoId);
        }
        return true;
    }

    //完全平仓
    async closePosition (symbol,posSide) {
        let pos = await this.getPositions(symbol)
        // console.log(pos.state)
        if(pos.state){
            pos = pos.data.data;
            for(let p of pos){
                if(p.available != 0 && (posSide == p.holdSide || posSide.toUpperCase() == "ALL")){
                    let side = "close_short"
                    if(p.holdSide == "long"){
                        side = "close_long"
                    }
                    await this.createOrder(symbol,side,"market",p.available,null)
                }
            }
        }else{
            return pos;
        }
        await this.sendClose(symbol,"close_" + posSide)
        return { state: true, data:"no pos"}
        
    }

        //完全平仓获取利润
        async closePositionGetProfit (symbol,posSide) {
            let pos = await this.getPositions(symbol)
            let orders = []
            // console.log(pos.state)
            if(pos.state){
                pos = pos.data.data;
                for(let p of pos){
                    if(p.available != 0 && (posSide == p.holdSide || posSide.toUpperCase() == "ALL")){
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
            //await MyKit.sleep(200)
            let profit = 0;
            for(let order of orders){
                for(let i = 0;i <= 20;i++ ){
                    let info = await this.getOrderInfo(symbol,order.data.data.orderId)
                    if(info.data.data.state == "filled"){
                        profit += (parseFloat(info.data.data.totalProfits) + parseFloat(info.data.data.fee) * 2)
                        break
                    }
                    await MyKit.sleep(100)
                }
            }
            await this.sendClose(symbol,"close_" + posSide)
            return profit
            
        }


}

// 请求转发基地址与交易所基地址 
BitgetFuture.baseRequestURL = isDev ? '/api/forward' : 'http://localhost:11000/forward'
BitgetFuture.baseURL = 'https://api.bitget.com'
BitgetFuture.baseFutureURL = 'https://api.bitget.com'
BitgetFuture.baseBack = "http://localhost:12000"


//export default BitgetFuture
module.exports = BitgetFuture
