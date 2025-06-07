class ExchangeFactory {
  constructor() {
    this.exchanges = {
      Bitget: () => import('./Bitget.mjs'),
      Okx: () => import('./Okx.mjs'),
    };
  }

  async createExchange(name, apiInfo) {
    const exchangeLoader = this.exchanges[name];
    if (!exchangeLoader) {
      throw new Error(`Exchange ${name} is not supported.`);
    }

    const ExchangeClass = (await exchangeLoader()).default;
    return new ExchangeClass(apiInfo);
  }

  registerExchange(name, loader) {
    if (this.exchanges[name]) {
      throw new Error(`Exchange ${name} is already registered.`);
    }
    this.exchanges[name] = loader;
  }
}

export default new ExchangeFactory();
