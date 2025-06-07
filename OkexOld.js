
import $http from 'axios'
import CryptoJS from 'crypto'
import moment from 'moment'
import MyKit from '@/strategy/kit/MyKit'


//const isDev = process.env.NODE_ENV === 'development'
const isDev = false
const OKEx_Spot = {}


class OkexFuture {
    constructor(name, apiKey, secretKey, passphrase,vue) {
        this.name = name
        this.apiKey = apiKey
        this.secretKey = secretKey
        this.passphrase = passphrase
        this.vue = vue
        this.fee = 0.2
        
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
        const URI = `/api/v5/account/balance`
        let rst = await this.baseGet(URI,`ccy=${ccy}`);
        return rst;
    }

    async baseGet02(URI,pathData){
        let timestamp = MyKit.timestampToUTC(new Date().getTime() + (-8 * 60 * 60 * 1000) )
        let URL =  OkexFuture.baseURL + URI + '?' + pathData;
        const params = {
            url: URL,
            method: 'GET',
            timeout: 10 * 1000,
            headers: {
                'OK-ACCESS-KEY': this.apiKey,
                'OK-ACCESS-SIGN':MyKit.crypOkex(timestamp + 'GET' +  URI + '?' + pathData,this.secretKey),
                'OK-ACCESS-TIMESTAMP':timestamp,
                'OK-ACCESS-PASSPHRASE':this.passphrase,
                'Content-Type': 'application/json',
            }
        }
        const {data: rst} = await $http.post(OkexFuture.baseRequestURL, {url: URL, method: 'GET',header:params.headers})
        let res = rst.data
        let isSuccess = true
        if(!res || !res.code || !(parseInt(res.code)  == 0)){
            if(res&&res.code&&res.code == 50011){
                this.vue.logError("--- 收到频率过高警告  ---")
            }
            isSuccess = false
        }
        await MyKit.sleep(200)
        return { state: isSuccess, data:res}
    }

   // async dirctBaseGet(URI,pathData){
    async baseGet(URI,pathData){
        let timestamp = MyKit.timestampToUTC(new Date().getTime() + (-8 * 60 * 60 * 1000) )
        let URL =  OkexFuture.baseURL + URI + '?' + pathData;
        const params = {
            url: URL,
            method: 'GET',
            timeout: 10 * 1000,
            headers: {
                'OK-ACCESS-KEY': this.apiKey,
                'OK-ACCESS-SIGN':MyKit.crypOkex(timestamp + 'GET' +  URI + '?' + pathData,this.secretKey),
                'OK-ACCESS-TIMESTAMP':timestamp,
                'OK-ACCESS-PASSPHRASE':this.passphrase,
                'Content-Type': 'application/json',
            }
        }
        // const {data: rst} = await $http.post(OkexFuture.baseURL, {url: URL, method: 'GET',header:params.headers})
        const {data: rst} = await $http.get(URL, {headers: params.headers})
        let res = rst
        
        let isSuccess = true
        if(!res || !res.code || !(parseInt(res.code)  == 0)){
            if(res&&res.code&&res.code == 50011){
                this.vue.logError("--- 收到频率过高警告  ---")
            }
            isSuccess = false
        }
        await MyKit.sleep(200)
        return { state: isSuccess, data:res}
    }

        //基础post
    async basePost02 (URI,body) {
        let timestamp = MyKit.timestampToUTC(new Date().getTime() + (-8 * 60 * 60 * 1000) )
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

        const {data: rst} = await $http.post(OkexFuture.baseRequestURL, {url: params.url, method: 'POST',data: body,header:params.headers})
        let res = rst.data
        let isSuccess = true
        // console.log(res)
        if(!res || !(parseInt(res.code) == 0)){
            if(res && res.code && res.code == 50011){
                this.vue.logError("--- 收到频率过高警告  ---")
            }
            isSuccess = false
        }
        await MyKit.sleep(200)
        return { state: isSuccess, data:res}
    }

    //基础post
    async basePost (URI,body) {
        let timestamp = MyKit.timestampToUTC(new Date().getTime() + (-8 * 60 * 60 * 1000) )
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

        const {data: rst} = await $http.post(params.url, params.data,{headers: params.headers})
        let res = rst
        let isSuccess = true
        // console.log(res)
        if(!res || !(parseInt(res.code) == 0)){
            if(res && res.code && res.code == 50011){
                this.vue.logError("--- 收到频率过高警告  ---")
            }
            isSuccess = false
        }
        await MyKit.sleep(200)
        return { state: isSuccess, data:res}
    }

    //设置杠杆
    async setLev(symbol,lev){
        const URI = `/api/v5/account/set-leverage`

        let body = {
            instId:symbol,
            lever:lev,
            mgnMode:"cross"
        }
        let rst = await this.basePost(URI,body)
        return rst;

    }
    

   //获取k线信息
    async getKline(symbol,cycle) {
        const URI = `/api/v5/market/candles`
        let rst = await this.baseGet(URI,`instId=${symbol}&bar=${cycle}&limit=100`);
        return rst;
    }

    async getPriceInfo(symbol) {
        const URI = `/api/v5/market/ticker`
        let rst = await this.baseGet(URI,`instId=${symbol}`);
        return rst;
    }

    async createOrder(symbol,tdMode,side,posSide,ordType,num,px,tpTriggerPx,tpOrdPx,slTriggerPx,slOrdPx) {
        // if(px != null){
        //     px = parseFloat(px).toFixed(4);
        // }
        if(num != null){
            num = parseFloat(num).toFixed(0);
        }
        const URI = `/api/v5/trade/order`
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
            tag:this.vue.bCode
        }
        let rst = await this.basePost(URI,this.clearBody(body))
        return rst;
    }
    createOrderBody(symbol,tdMode,side,posSide,ordType,num,px,tpTriggerPx,tpOrdPx,slTriggerPx,slOrdPx) {
        if(num != null){
            num = parseFloat(num).toFixed(0);
        }
        const URI = `/api/v5/trade/order`
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
            tag:this.vue.bCode
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

    //获取订单信息
    async getOrderInfo(symbol,orderId){
        const URI = `/api/v5/trade/order`
        
        let rst = await this.baseGet(URI,'instId=' + symbol + '&' + 'ordId=' + orderId);
        return rst;
    }

    //张币转换
    async convert(symbol,type,sz,px){
        const URI = `/api/v5/public/convert-contract-coin`
        
        let rst = await this.baseGet(URI,'instId=' + symbol + '&' + 'type=' + type + '&' + 'sz=' + sz + '&' + 'px=' + px + '&' + 'unit=usds');
        return rst;
}

    async getPositions(symbol) {
        const URI = `/api/v5/account/positions`
        let rst = await this.baseGet(URI,'instId=' + symbol)
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

    //撤销订单
    async cancelOrder(symbol,ordId){
        const URI = `/api/v5/trade/cancel-order`;

        let body = {
            instId:symbol,
            ordId
        }
        return await this.basePost(URI,body);
    }

    //撤销全部
    async cancelALLOrder(symbol) {
        let orders = await this.listPendingOrders(symbol);
        orders = orders.data.data
        for(let or of orders){
            await this.cancelOrder(symbol,or.ordId);
        }
        return true;
    }

    //撤销全部策略
    async cancelALLAlgoOrder(symbol) {
        let orders = await this.listAlgoPendingOrders(symbol);
        
        orders = orders.data.data
        for(let or of orders){
            console.log(or.algoId)
            await this.cancelAlgoOrder(symbol,or.algoId);
        }
        return true;
    }

    //完全平仓
    async closePosition (symbol,posSide) {
        const URI = `/api/v5/trade/close-position`;

        let body = {
            instId:symbol,
            mgnMode:"cross",
            posSide,
        }
        body = this.clearBody(body);
        return await this.basePost(URI,body);
    }


}

// 请求转发基地址与交易所基地址 
OkexFuture.baseRequestURL = isDev ? '/api/forward' : 'http://localhost:11000/forward'
OkexFuture.baseURL = 'https://www.okx.com'
OkexFuture.baseFutureURL = 'https://www.okx.com'


export default OkexFuture
