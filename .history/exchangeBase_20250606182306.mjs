
class BaseExchange {
  constructor(name) {
    this.name = name;
  }

  async getSymbolAndUpMapping(){
    throw new Error('Method not implemented: getFundingRate');
  }
 
}

// 默认导出 + 具名导出，便于两种方式引入
export default BaseExchange;