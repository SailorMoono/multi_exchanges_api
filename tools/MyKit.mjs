
class MyKit {
}

/**
 * 截取小数位工具
 * @param num 需要截取的小数
 * @param n 截取位数
 * @returns {number}
 * @private
 */
MyKit._N = function (num, n) {
    let rst = num.toString()

    if (rst.indexOf('.') !== -1) {
        rst = rst.substring(0, rst.indexOf('.') + n + 1)
    }

    return parseFloat(rst)
}

/**
 * 转成非科学计数法
 * @param num
 * @returns {string}
 */
MyKit.toNonExponential = function (num) {
    const m = num.toExponential().match(/\d(?:\.(\d*))?e([+-]\d+)/)
    return num.toFixed(Math.max(0, (m[1] || '').length - m[2]))
}
MyKit.ArrayDel = function (arr,value){
    arr.splice(arr.indexOf(value), 1)
}

/**
 * 睡眠工具
 * @param time 单位：毫秒
 * @returns {Promise<unknown>}
 */
MyKit.sleep = function (time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(true)
        }, time)
    })
}





MyKit.timestampToUTC = function(dateStr) {
    let utcTimeString =  MyKit.dateFormat('YYYY-mm-ddTHH:MM:SS.sssZ', new Date(parseInt(dateStr)))
    return utcTimeString;

}

export default MyKit;