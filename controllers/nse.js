const NseIndiaClass = require("stock-nse-india");

const nse = new NseIndiaClass.NseIndia();

const getStockData = async (req, res) => {
  let body = req.body;
  nse.getEquityStockIndices(body.index).then(symbols  => {
    let result = {
      data: symbols.metadata,
      ason: symbols.timestamp,
      indexName: symbols.name,
    }
    res.json(result);
    return
  }, err => {
      console.log(err);
      res.status(500).json(err);
  });
}

module.exports.getStockData = getStockData;