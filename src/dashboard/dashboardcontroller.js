const sql = require('mssql');

const jwt = require("jsonwebtoken");

const config=require("../config/config")

const fetchData = async (req, res) => {
    const date = req.query.date ? req.query.date : new Date().toISOString().split('T')[0];

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
  
      // const response = {
      //   basicValue: parseFloat(basicValueResult.recordset[0].basictotal.toFixed(2)),
      //   grnValue: parseFloat(grnValueResult.recordset[0].grnValue.toFixed(2)),
      //   POTotal: parseFloat(POTotalResult.recordset[0].POTotal.toFixed(2)),
      // };
      let basicValue=0;
      let grnValue=0;
      let POTotal=0;
      if(basicValueResult.recordset[0].basictotal){
        basicValue=parseFloat(basicValueResult.recordset[0].basictotal.toFixed(2))
      }
      if(grnValueResult.recordset[0].grnValue){
        grnValue=parseFloat(grnValueResult.recordset[0].grnValue.toFixed(2))
      }
      if(POTotalResult.recordset[0].POTotal){
        POTotal=parseFloat(POTotalResult.recordset[0].POTotal.toFixed(2))
      }
    

      const response = {
        basicValue: basicValue,
        grnValue: grnValue,
        POTotal: POTotal,
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

  const BasicValue = async (req, res) => {
    const date = req.query.date ? req.query.date : new Date().toISOString().split('T')[0];

    const querry = `Select custcode, custname, invdate1, invoiceno1, sum(BasicValue) as basictotal
    from Invoice I inner join Customer c on c.custid = I.CustID inner join Sales_CustType ct on ct.CTypeID = C.CTypeID
    Where  I.InvDate1 = '${date}'
    group by custcode, custname, invoiceno1,invdate1
    order by CustCode,InvoiceNo1`;
  
    try {
      await sql.connect(config); // Wait for the database connection to be established
      let request = new sql.Request();
      const data = await request.query(querry); // Wait for the query to complete
      res.send(data.recordset); // Assuming you want to send the query result as a response
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving data.",
      });
    }
  };

  const BasicValuerange = async (req, res) => {
    const date1 = req.query.fromdate ? req.query.fromdate : new Date().toISOString().split('T')[0];
    const date2 = req.query.todate ? req.query.todate : new Date().toISOString().split('T')[0];


    const querry = `Select custcode, custname, invdate1, invoiceno1, sum(BasicValue) as basictotal
    from Invoice I inner join Customer c on c.custid = I.CustID inner join Sales_CustType ct on ct.CTypeID = C.CTypeID
    Where  I.InvDate1 between '${date1}' and '${date2}'
    group by custcode, custname, invoiceno1,invdate1
    order by CustCode,InvoiceNo1`;
  
    try {
      await sql.connect(config); // Wait for the database connection to be established
      let request = new sql.Request();
      const data = await request.query(querry); // Wait for the query to complete
      res.send(data.recordset); // Assuming you want to send the query result as a response
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving data.",
      });
    }
  };

  const searchPO = async (req, res) => {
    const querry = `Select d.PoId, d.PoNo, d.PoDate, d.Addnlparameter, SupName + ' | ' + SupCode As gStrSupplierDisp, RawMatCode + ' | ' + RawMatName 
    As gStrMatDisp, GCode + ' | ' + Gradename As gStrGradeDisp, d.Ord_Qty, d.Uom, round(d.Rate, 4) as Rate, 
    d.CurrCode as Currency, ((d.Rate * d.ExRate + Pack) - Discount) as price, round((d.Ord_Qty * ((d.Rate + d.pack) - Discount)), 2) as povalue, d.RawMatId, 
    d.ProdName, d.ProdId, A.Minlimit, A.Maxlimit, d.TotalPoValue, d.CurrID, CharVals, D.EMPNAME AS POCreatedBY, d.HSNID, GH.HSNCode 
    From Invent_PoDetails_Query d Left Outer Join GST_HSN_SAC_NO GH on GH.Hsn_Sac_ID = D.HSNID Inner Join (Select Distinct PS.Empid, poid, Minlimit, Maxlimit From Invent_POApprovalLevels PE (Nolock) 
    Inner Join Invent_POApprovalEmpLevel PS (Nolock) on PE.levelid = PS.Levelid Inner Join Invent_PoDetails_Query P on P.GTotal = 0 and PE.Locationid = 1 
    or (Case when PE.IsBasic = 'N' then (P.GTotal + (Select isnull(Sum(Amount), 0) From Invent_PoprodWiseTax T Where T.poid = P.Poid)) else P.GTotal End * P.Exrate 
    <= PE.Maxlimit) and (Case when PE.IsBasic = 'N' then(P.GTotal + (Select isnull(Sum(Amount), 0) From Invent_PoprodWiseTax T Where T.poid = P.Poid)) else P.GTotal End * P.Exrate 
    >= PE.Minlimit) Where postatus in ('Approval Pending') and PS.Empid = 1 and PE.POType = P.AddnlParameter and PE.Locationid = 1 
    and PE.Levelid Not In (Select  Distinct Levelid From Invent_POApprovedEmployee A Where A.Poid = P.POiD and A.Levelid = PE.Levelid and PE.Locationid = 1) 
    and  1=1 ) A on A.poid = d.poid  and Addnlparameter='General Purchase' and  1=1 and D.locationid = 1 and PoStatus = 'Approval Pending' Order By PoPurTypeId, PoDate, 
    PoNo, PoProductId`;
  
    try {
      await sql.connect(config); // Wait for the database connection to be established
      let request = new sql.Request();
      const data = await request.query(querry); // Wait for the query to complete
      res.send(data.recordset); // Assuming you want to send the query result as a response
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving data.",
      });
    }
  };
  module.exports = {
    fetchData,
    BasicValue,
    BasicValuerange,
    searchPO
}
  