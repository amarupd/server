const sql = require('mssql');

const jwt = require("jsonwebtoken");

const config=require("../config/config")

const fetchData = async (req, res) => {
    const date = (req.body.date ? new Date(req.body.date) : new Date()).toISOString().split('T')[0];
    console.log(date);
  
    const basicValueQuery = `SELECT SUM(BasicValue) as basictotal 
      FROM Invoice I INNER JOIN Customer c ON c.custid = I.CustID INNER JOIN Sales_CustType ct ON ct.CTypeID = C.CTypeID
      WHERE I.InvDate1 = '${date}'`;
  
    const grnValueQuery = `SELECT SUM(gds.Qty*Grate) as grnValue  
      FROM Invent_grn grn INNER JOIN Invent_GrnMaterialdetail gmd ON gmd.Grnno = grn.GrnNo 
      INNER JOIN Invent_Supplier sup ON sup.supid = grn.supid INNER JOIN RawMaterial rm ON rm.RawMatid = gmd.Rawmatid 
      LEFT OUTER JOIN (
        SELECT GrnID, pd.DelSchedule, SUM(Qty) as Qty  
        FROM Invent_GrnDeliverySchedule gds 
        INNER JOIN Invent_PurchaseDelivery pd ON pd.PODespatchID = gds.DelSchID
        GROUP BY GrnID, pd.DelSchedule
      ) gds ON gds.grnid = gmd.GRNID
      WHERE grn.AddnlParameter ='Grn With PO' AND Grn.GrnDate = '${date}'`;
  
    const POTotalQuery = `SELECT SUM(pp.Ord_Qty*pp.rate) as POTotal 
      FROM purchase p INNER JOIN purchaseproduct pp ON p.poid = pp.poid
      WHERE p.PODate = '${date}'`;
  
    try {
      await sql.connect(config);
      let request = new sql.Request();
  
      const basicValueResult = await request.query(basicValueQuery);
      const grnValueResult = await request.query(grnValueQuery);
      const POTotalResult = await request.query(POTotalQuery);
  
      const response = {
        basicValue: parseFloat(basicValueResult.recordset[0].basictotal.toFixed(2)),
        grnValue: parseFloat(grnValueResult.recordset[0].grnValue.toFixed(2)),
        POTotal: parseFloat(POTotalResult.recordset[0].POTotal.toFixed(2)),
      };
  
    //   res.send(JSON.stringify(response, null, 2));
      res.send(response);
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving data.",
      });
    }
  };

  module.exports = {
    fetchData
}
  