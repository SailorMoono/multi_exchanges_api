
class ExchangeBase {
  constructor(name) {
    this.name = name;
  }

  async getSymbolAndUpMapping(){
    throw new Error('Method not implemented: getFundingRate');
  }
 
}

export default ExchangeBase;