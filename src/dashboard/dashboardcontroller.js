const sql = require('mssql');

const jwt = require("jsonwebtoken");

const config = require("../config/config")

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
    let basicValue = 0;
    let grnValue = 0;
    let POTotal = 0;
    if (basicValueResult.recordset[0].basictotal) {
      basicValue = parseFloat(basicValueResult.recordset[0].basictotal.toFixed(2))
    }
    if (grnValueResult.recordset[0].grnValue) {
      grnValue = parseFloat(grnValueResult.recordset[0].grnValue.toFixed(2))
    }
    if (POTotalResult.recordset[0].POTotal) {
      POTotal = parseFloat(POTotalResult.recordset[0].POTotal.toFixed(2))
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

const sales_details = async (req, res) => {

  const date = req.query.date ? req.query.date : new Date().toISOString().split('T')[0];

  console.log(date);

  const type = req.query.type

  const querry = `select MonthSales,  TransactionNumber, TransactionDate, BillNo, '' as Qty, Amount, Name from (
-----Current Month Sales
Select 'Current Month Sales' as MonthSales ,ah.AccountName, t.TransactionNumber, t.TransactionDate ,t.BillNo, Sum(Case When t.Drcr = 'Cr' then Amount else -Amount end) as Amount, p.Name
from IcSoftLedger.dbo.Transactions t inner join IcSoftLedger.dbo.accounts a on a.ID = t.accountid 
inner join IcSoftLedger.dbo.accountheads ah on ah.AccountID = a.accountid left outer join (
Select a.Name, a.AccountCode, t1.TransactionNumber from IcSoftLedger.dbo.Transactions t1 inner join IcSoftLedger.dbo.accounts a on a.ID = t1.AccountID Where OLevelID in (2,6) 
 and  Month(t1.transactiondate) = month('${date}') and   Year(t1.transactiondate) = Year(Dateadd(YY,0,'${date}')) ) p
on p.TransactionNumber = t.TransactionNumber
 Where ah.AccountTypeID = 4  and Month(t.transactiondate) = month('${date}') and   Year(t.transactiondate) = Year(Dateadd(YY,0,'${date}'))
 and t.Edited<>'D' and t.Approved = 'Y'
 Group By ah.AccountName, t.TransactionNumber,t.TransactionDate , t.BillNo, p.Name
 Union All
 -----Current Month Sales Prev. year
Select 'Current Month Sales Pre. Year' as MonthSales ,ah.AccountName, t.TransactionNumber, t.TransactionDate ,t.BillNo, Sum(Case When t.Drcr = 'Cr' then Amount else -Amount end) as Amount, p.Name
from IcSoftLedger.dbo.Transactions t inner join IcSoftLedger.dbo.accounts a on a.ID = t.accountid 
inner join IcSoftLedger.dbo.accountheads ah on ah.AccountID = a.accountid left outer join (
Select a.Name, a.AccountCode, t1.TransactionNumber from IcSoftLedger.dbo.Transactions t1 inner join IcSoftLedger.dbo.accounts a on a.ID = t1.AccountID Where OLevelID in (2,6) 
 and  Month(t1.transactiondate) = month('${date}') and   Year(t1.transactiondate) = Year(Dateadd(YY,-1,'${date}')) ) p
on p.TransactionNumber = t.TransactionNumber
 Where ah.AccountTypeID = 4  and Month(t.transactiondate) = month('${date}') and   Year(t.transactiondate) = Year(Dateadd(YY,-1,'${date}'))
 and t.Edited<>'D' and t.Approved = 'Y'
 Group By ah.AccountName, t.TransactionNumber,t.TransactionDate , t.BillNo, p.Name
 Union All
 -----Current Quarter Sales
Select 'Current Quarter Sales Pre. Year' as MonthSales ,ah.AccountName, t.TransactionNumber, t.TransactionDate ,t.BillNo, Sum(Case When t.Drcr = 'Cr' then Amount else -Amount end) as Amount, p.Name
from IcSoftLedger.dbo.Transactions t inner join IcSoftLedger.dbo.accounts a on a.ID = t.accountid 
inner join IcSoftLedger.dbo.accountheads ah on ah.AccountID = a.accountid left outer join (
Select a.Name, a.AccountCode, t1.TransactionNumber from IcSoftLedger.dbo.Transactions t1 inner join IcSoftLedger.dbo.accounts a on a.ID = t1.AccountID Where OLevelID in (2,6) 
 and (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where t1.TransactionDate between fromdate and ToDate ) =
 (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where '${date}' between fromdate and ToDate ) ) p
on p.TransactionNumber = t.TransactionNumber
 Where ah.AccountTypeID = 4  and (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where t.TransactionDate between fromdate and ToDate ) =
 (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where ('${date}')  between fromdate and ToDate )
 and t.Edited<>'D' and t.Approved = 'Y'
 Group By ah.AccountName, t.TransactionNumber,t.TransactionDate , t.BillNo, p.Name ) v
----filter on Type
--where v.MonthSales in ('${type}')
order by TransactionDate
`;

console.log(querry);

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

const quatation_details = async (req, res) => {

  const type = req.query.type //? req.query.type : ;

  console.log(type);

  const querry = `select Type ,Quot_Ref_No, QuotDate, Enq_Ref_No,Qty, GTotal, Name from (
select 'Quotation Submitted' as Type, q.Quot_Ref_No, QuotDate, en.Enq_Ref_No,ep.Qty,qp.Qty*qp.Price_Unit as Gtotal, pd.name
 from quotation_Product qp inner join quotations q on qp.QuotID = q.QuotID
 left outer join Enquiry_Product ep on qp.EnquiryProdID = ep.EnquiryProdID
 left outer join enquiry en on en.EnquiryID = ep.EnquiryID
 left outer join PartyDetail pd on pd.PartyID = en.Custid
 where QuotDate > '01-Apr-2023'
UNION ALL
select 'Quotation Accepted' as Type, q.Quot_Ref_No, QuotDate, en.Enq_Ref_No,ep.Qty, qp.Qty*qp.Price_Unit as Gtotal, pd.name 
 from purchaseproduct pp inner join Purchase p on p.POID = pp.poid
 inner join quotation_Product qp on qp.QuotationProdID = pp.QuotationProdId
 inner join quotations q on qp.QuotID = q.QuotID
 left outer join Enquiry_Product ep on qp.EnquiryProdID = ep.EnquiryProdID
 left outer join enquiry en on en.EnquiryID = ep.EnquiryID
 left outer join PartyDetail pd on pd.PartyID = en.Custid
 where pp.QuotationProdId <> 0 and p.PODate > '01-Apr-2023' 
 UNION ALL
select 'Quotation Rejected' as Type, q.Quot_Ref_No, QuotDate, en.Enq_Ref_No,ep.Qty, qp.Qty*qp.Price_Unit as Gtotal, pd.name 
from quotation_Product qp inner join quotations q on qp.QuotID = q.QuotID
left outer join Enquiry_Product ep on qp.EnquiryProdID = ep.EnquiryProdID
 left outer join enquiry en on en.EnquiryID = ep.EnquiryID
 left outer join PartyDetail pd on pd.PartyID = en.Custid
 where Price_Unit = 0 and QuotDate > '01-Apr-2023' ) v
 ----filter on Type 
 --where v.type = '${type}'
`;

console.log(querry);


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

const enquiry_details = async (req, res) => {
  const type = req.query.type
  const querry = `select Type, IntEnqRefNo, Date_of_Enquiry, Enq_Ref_No, Qty, '' as Amount, Name from (
select 'Today Enquiry' as Type, en.IntEnqRefNo, Date_of_Enquiry, en.Enq_Ref_No, ep.Qty, pd.Name from enquiry en
left outer join Enquiry_Product ep on ep.EnquiryID = en.EnquiryID
left outer join PartyDetail pd on pd.PartyID = en.Custid
	where Date_of_Enquiry = GETDATE()
UNION ALL
select 'Last Week Enquiry' as Type, en.IntEnqRefNo, Date_of_Enquiry, en.Enq_Ref_No, ep.Qty, pd.Name from enquiry en
left outer join Enquiry_Product ep on ep.EnquiryID = en.EnquiryID
left outer join PartyDetail pd on pd.PartyID = en.Custid
	where Date_of_Enquiry >= DATEADD(week, -1, GETDATE())
UNION ALL
select 'Last Month Enquiry' as Type, en.IntEnqRefNo, Date_of_Enquiry, en.Enq_Ref_No, ep.Qty, pd.Name from enquiry en
left outer join Enquiry_Product ep on ep.EnquiryID = en.EnquiryID
left outer join PartyDetail pd on pd.PartyID = en.Custid
	where Date_of_Enquiry >= DATEADD(month, -1, GETDATE())
UNION ALL
select 'Last Year Enquiry' as Type, en.IntEnqRefNo, Date_of_Enquiry, en.Enq_Ref_No, ep.Qty, pd.Name from enquiry en
left outer join Enquiry_Product ep on ep.EnquiryID = en.EnquiryID
left outer join PartyDetail pd on pd.PartyID = en.Custid
	where Date_of_Enquiry >= DATEADD(month, -1, GETDATE())
UNION ALL
select 'Today Rej Enquiry' as Type, en.IntEnqRefNo, Date_of_Enquiry, en.Enq_Ref_No, ep.Qty, pd.Name from enquiry en
left outer join Enquiry_Product ep on ep.EnquiryID = en.EnquiryID
left outer join PartyDetail pd on pd.PartyID = en.Custid
	where Date_of_Enquiry = GETDATE() and  enquirysentstatus = 'Hisotry'
UNION ALL
select 'LastWeek Rej Enquiry' as Type, en.IntEnqRefNo, Date_of_Enquiry, en.Enq_Ref_No, ep.Qty, pd.Name from enquiry en
left outer join Enquiry_Product ep on ep.EnquiryID = en.EnquiryID
left outer join PartyDetail pd on pd.PartyID = en.Custid
	where Date_of_Enquiry >= DATEADD(week, -1, GETDATE()) and  enquirysentstatus = 'History'
UNION ALL
select 'LastMonth Rej Enquiry' as Type, en.IntEnqRefNo, Date_of_Enquiry, en.Enq_Ref_No, ep.Qty, pd.Name from enquiry en
left outer join Enquiry_Product ep on ep.EnquiryID = en.EnquiryID
left outer join PartyDetail pd on pd.PartyID = en.Custid
	where Date_of_Enquiry >= DATEADD(month, -1, GETDATE()) and  enquirysentstatus = 'History'
UNION ALL
select 'LastYear Rej Enquiry' as Type, en.IntEnqRefNo, Date_of_Enquiry, en.Enq_Ref_No, ep.Qty, pd.Name from enquiry en
left outer join Enquiry_Product ep on ep.EnquiryID = en.EnquiryID
left outer join PartyDetail pd on pd.PartyID = en.Custid
	where Date_of_Enquiry >= DATEADD(Year, -1, GETDATE()) and  enquirysentstatus = 'History' ) k
---filter on Type
--where k.Type = '${type}'`;

console.log(querry);


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
const due_details = async (req, res) => {
  const type = req.query.type
  const querry = `select Type, IntPONo, SOEntryDate, PONo, OrderQty, OrdValue, CustShort from (
-------Over Due sales Orders
Select 'Over Due sales Orders' as Type, IntPONo, SOEntryDate, PONo, OrderQty, OrdValue, CustShort
 from ST_PendingSalesOrderdetail Where intDelDate < Getdate()
Union All
 ------Duein Next 7 Days Sales Orders
Select 'Due in Next 7 Days SalesOrders' as Type, IntPONo, SOEntryDate, PONo, OrderQty, OrdValue, CustShort
 from ST_PendingSalesOrderdetail Where intDelDate between Getdate() and Dateadd(dd,7,Getdate())
Union All
 ------Duein Next One Month Days Sales Orders
 Select 'Due in Next One Month SalesOrders' as Type, IntPONo, SOEntryDate, PONo, OrderQty, OrdValue, CustShort
 from ST_PendingSalesOrderdetail Where intDelDate between Getdate() and Dateadd(dd,30,Getdate()) ) s
 ---
 --where s.Type = '${type}'`;

 console.log(querry);


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

const order_value_details = async (req, res) => {
  const type = req.query.type
  const querry = `select Type, IntPONo, SOEntryDate, PONo, Ord_Qty, GTotal, custname from (
---Curr Month Order Value
  Select 'Currr Month OrdValue' as Type, po.IntPONo, po.SOEntryDate, po.PONo, pp.Ord_Qty, Ord_Qty*pp.rate as Gtotal, c.custname
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where  Month(po.Created_Date) = month('01-Apr-24') and   Year(po.Created_Date) = Year(Dateadd(YY,0,'01-Apr-24'))
Union All
---Curr Month Prev Year Order Value
  Select 'Curr Month Prev Year OrdValue' as Type, po.IntPONo, po.SOEntryDate, po.PONo, pp.Ord_Qty, Ord_Qty*pp.rate as Gtotal, c.custname
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where  Month(po.Created_Date) = month('01-Apr-24') and   Year(po.Created_Date) = Year(Dateadd(YY,-1,'01-Apr-24'))
Union All
---Curr Quarter Order Value
  Select 'Curr Quarter OrdValue' as Type, po.IntPONo, po.SOEntryDate, po.PONo, pp.Ord_Qty, Ord_Qty*pp.rate as Gtotal, c.custname
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where  (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where po.Created_Date between fromdate and ToDate ) =
 (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where Dateadd(YY,0,'01-Apr-24') between fromdate and ToDate )
Union All
---Curr Quarter Prev Year Order Value
  Select 'Curr Quarter Prev Year OrdValue', po.IntPONo, po.SOEntryDate, po.PONo, pp.Ord_Qty, Ord_Qty*pp.rate as Gtotal, c.custname
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where  (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where po.Created_Date between fromdate and ToDate ) =
 (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where Dateadd(YY,-1,'01-Apr-24') between fromdate and ToDate )
 Union All
 ---Curr Year Order Value
  Select 'Curr Year OrdValue' as Type, po.IntPONo, po.SOEntryDate, po.PONo, pp.Ord_Qty, Ord_Qty*pp.rate as Gtotal, c.custname
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where (Select yearname from icSoft.dbo.ST_FinancialYear Where Convert(Date,po.Created_Date,11) between fromdate and ToDate ) =
 (Select yearname from icSoft.dbo.ST_FinancialYear Where Dateadd(YY,0,'01-Apr-24') between fromdate and ToDate )
 Union All
 ---Prev Year Order Value
  Select 'Prev Year OrdValue', po.IntPONo, po.SOEntryDate, po.PONo, pp.Ord_Qty, Ord_Qty*pp.rate as Gtotal, c.custname
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where (Select yearname from icSoft.dbo.ST_FinancialYear Where Convert(Date,po.Created_Date,11) between fromdate and ToDate ) =
 (Select yearname from icSoft.dbo.ST_FinancialYear Where Dateadd(YY,-1,'01-Apr-24') between fromdate and ToDate ) ) p
 ---filter on Type
 --where p.type = '${type}'`;

 console.log(querry);

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

const sales_summary = async (req, res) => {
  const date = req.query.date ? req.query.date : new Date().toISOString().split('T')[0];

  console.log(date);

  const querry = `Select AccountName, Round(Sum(CM_Sales)/100000,2) as CMSales, Round(Sum(PCMSales)/100000,2) as PCMSales, Round(Sum(CQSales)/100000,0) as CQSales, Round(Sum(PQSales)/100000,2) CQ_PYSales, Round(Sum(CYSales)/100000,2) as CYSales,
Round(Sum(PYSales)/100000,2) as PYSales
 from ( -----Current Month Sales
Select ah.AccountName, Sum(Case When t.Drcr = 'Cr' then Amount else -Amount end) as CM_Sales, 0 as PCMSales, 0 as CQSales, 0 PQSales, 0 as CYSales,
0 PYSales  
from IcSoftLedger.dbo.Transactions t inner join IcSoftLedger.dbo.accounts a on a.ID = t.accountid inner join IcSoftLedger.dbo.accountheads ah on ah.AccountID = a.accountid
 Where ah.AccountTypeID = 4 
 and Month(t.transactiondate) = month('${date}') and   Year(t.transactiondate) = Year(Dateadd(YY,0,'${date}'))
 Group By Ah.AccountName
 Union All
 ----- Prev year Current Month Sales
 Select ah.AccountName, 0 as CMSales, Sum(Case When t.Drcr = 'Cr' then Amount else -Amount end) as PCMSales, 0 as CQSales, 0 PQSales, 0 as CYSales,
0 PYSales  
from IcSoftLedger.dbo.Transactions t inner join IcSoftLedger.dbo.accounts a on a.ID = t.accountid inner join IcSoftLedger.dbo.accountheads ah on ah.AccountID = a.accountid
 Where ah.AccountTypeID = 4 -----and t.transactiondate between '01-Apr-24' and '30-Apr-24'
 and Month(t.transactiondate) = month('${date}') and   Year(t.transactiondate) = Year(Dateadd(YY,-1,'${date}'))
 Group By Ah.AccountName
 Union All 
 ----Current Quarter Sales 
  Select ah.AccountName, 0 as CMSales, 0 as PCMSales, Sum(Case When t.Drcr = 'Cr' then Amount else -Amount end) as CQSales, 0 PQSales, 0 as CYSales,
0 PYSales  
from IcSoftLedger.dbo.Transactions t inner join IcSoftLedger.dbo.accounts a on a.ID = t.accountid inner join IcSoftLedger.dbo.accountheads ah on ah.AccountID = a.accountid
 Where ah.AccountTypeID = 4 -----and t.transactiondate between '01-Apr-24' and '30-Apr-24'
  and (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where t.TransactionDate between fromdate and ToDate ) =
 (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where '${date}' between fromdate and ToDate )
 Group By Ah.AccountName
 Union All
 ---Pre Year Quarter sales
 Select ah.AccountName, 0 as CMSales, 0 as PCMSales, 0 as CQSales, Sum(Case When t.Drcr = 'Cr' then Amount else -Amount end) PQSales, 0 as CYSales,
0 PYSales  
from IcSoftLedger.dbo.Transactions t inner join IcSoftLedger.dbo.accounts a on a.ID = t.accountid inner join IcSoftLedger.dbo.accountheads ah on ah.AccountID = a.accountid
 Where ah.AccountTypeID = 4 -----and t.transactiondate between '01-Apr-24' and '30-Apr-24'
  and (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where t.TransactionDate between fromdate and ToDate ) =
 (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where Dateadd(YY,-1,'${date}') between fromdate and ToDate )
 Group By Ah.AccountName
 Union All
 ---Current Year sales
 Select ah.AccountName, 0 as CMSales, 0 as PCMSales, 0 as CQSales, 0 PQSales, Sum(Case When t.Drcr = 'Cr' then Amount else -Amount end) as CYSales,
0 PYSales  
from IcSoftLedger.dbo.Transactions t inner join IcSoftLedger.dbo.accounts a on a.ID = t.accountid inner join IcSoftLedger.dbo.accountheads ah on ah.AccountID = a.accountid
 Where ah.AccountTypeID = 4 -----and t.transactiondate between '01-Apr-24' and '30-Apr-24'
  and (Select yearname from icSoft.dbo.ST_FinancialYear Where t.TransactionDate between fromdate and ToDate ) =
 (Select yearname from icSoft.dbo.ST_FinancialYear Where '${date}' between fromdate and ToDate )
 Group By Ah.AccountName
 
 Union All
 ---Pre Year sales
 Select ah.AccountName, 0 as CMSales, 0 as PCMSales, 0 as CQSales, 0 PQSales, 0 as CYSales,
Sum(Case When t.Drcr = 'Cr' then Amount else -Amount end) PYSales  
from IcSoftLedger.dbo.Transactions t inner join IcSoftLedger.dbo.accounts a on a.ID = t.accountid inner join IcSoftLedger.dbo.accountheads ah on ah.AccountID = a.accountid
 Where ah.AccountTypeID = 4 -----and t.transactiondate between '01-Apr-24' and '30-Apr-24'
  and (Select yearname from icSoft.dbo.ST_FinancialYear Where t.TransactionDate between fromdate and ToDate ) =
 (Select yearname from icSoft.dbo.ST_FinancialYear Where Dateadd(YY,-1,'${date}') between fromdate and ToDate )
 Group By Ah.AccountName
  ) t1
 group By AccountName
`;

console.log(querry);


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

const pending_sales_summary = async (req, res) => {
  const date = req.query.date ? req.query.date : new Date().toISOString().split('T')[0];

  console.log(date);

  const querry = `Select Sum(ODBalOrdQty) as ODBalOrdQty, Round(Sum(ODBalOrdValue)/100000,2) ODBalOrdValue, Sum(NOWODBalOrdQty) as NOWODBalOrdQty, 
Round(Sum(NOWODBalOrdVal)/100000,2) as NOWODBalOrdVal, Sum(NOMODBalOrdQty)/100000 as NOMODBalOrdQty, Round(Sum(NOMODBalOrdVal)/100000,2) NOMODBalOrdVal,
  sum(BalOrdQty) as BalOrdQty , round(sum(BalOrderValue)/100000,2) as BalOrdValue
From (
------Over Due sales Orders
Select Count(POproductID) as NoofItems ,Sum(OrderQty)-Sum(DespQty) as ODBalOrdQty, Sum(OrdValue)-Sum(DespValue) as ODBalOrdValue,
0 as NOWODBalOrdQty, 0 as NOWODBalOrdVal,0 as NOMODBalOrdQty,0 as NOMODBalOrdVal, 0 as BalOrdQty, 0 as BalOrderValue
 from ST_PendingSalesOrderdetail Where intDelDate < '${date}'
Union All
 ------Duein Next 7 Days Sales Orders
Select Count(POproductID) as NoofItems ,0 as BalOrdQty, 0 as BalOrdValue,
Sum(OrderQty)-Sum(DespQty) as NOWODBalOrdQty, Sum(OrdValue)-Sum(DespValue) as NOWODBalOrdVal,0 as NOMODBalOrdQty,0 as NOMODBalOrdVal, 0 as BalOrdQty, 0 as BalOrderValue
 from ST_PendingSalesOrderdetail Where intDelDate between '${date}' and Dateadd(dd,7,'${date}')
Union All
 ------Duein Next One Month Days Sales Orders
 Select Count(POproductID) as NoofItems ,0 as BalOrdQty, 0 as BalOrdValue,
 0 as NOWODBalOrdQty, 0 as NOWODBalOrdVal,Sum(OrderQty)-Sum(DespQty) as NOMODBalOrdQty,Sum(OrdValue)-Sum(DespValue) as NOMODBalOrdVal, 0 as BalOrdQty, 0 as BalOrderValue
 from ST_PendingSalesOrderdetail Where intDelDate between '${date}' and Dateadd(dd,30,'${date}')
 Union All
 ------Total Pending Sales Orders
 Select Count(POproductID) as NoofItems ,0 as BalOrdQty, 0 as BalOrdValue, 
 0 as NOWODBalOrdQty, 0 as NOWODBalOrdVal, 0 as NOMODBalOrdQty, 0 as NOMODBalOrdVal, Sum(OrderQty)-Sum(DespQty) as BalOrdQty, Sum(OrdValue)-Sum(DespValue) as BalOrdValue
 from ST_PendingSalesOrderdetail
 ) t
`;
console.log(querry);

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

const order_booked_summary = async (req, res) => {

  const date = req.query.date ? req.query.date : new Date().toISOString().split('T')[0];

  console.log(date);

  const querry = `Select  Round(Sum(CMCYOrdVal)/100000,2) as CMCY, Round(Sum(CMPYOrdVal)/100000,2) as CMPY, Round(sum(CQCYOrdVal)/100000,2) as CQCY, Round(sum(CQPYOrdVal)/100000,2) as CQPY, Round(sum(CYOrdVal)/100000,2) as CY, Round(sum(PYOrdVal)/100000,2) as PY from (
---Curr Month Order Value
  Select 'CM CY Order Value' as DataType, Sum( pp.Ord_Qty*(pp.rate-pp.Discount+pp.Pack)*po.ExRate) as CMCYOrdVal, 0 CMPYOrdVal ,0 CQCYOrdVal,0 CQPYOrdVal,0 CYOrdVal,0 PYOrdVal
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where  Month(po.Created_Date) = month('${date}') and   Year(po.Created_Date) = Year(Dateadd(YY,0,'${date}'))
Union All
---Curr Month Prev Year Order Value
  Select 'CM PY Order Value' as DataType, 0 as CMCYOrdVal, Sum( pp.Ord_Qty*(pp.rate-pp.Discount+pp.Pack)*po.ExRate) CMPYOrdVal ,0 CQCYOrdVal,0 CQPYOrdVal,0 CYOrdVal,0 PYOrdVal
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where  Month(po.Created_Date) = month('${date}') and   Year(po.Created_Date) = Year(Dateadd(YY,-1,'${date}'))
Union All
---Curr Quarter Order Value
  Select 'CQ CY Order Value' as DataType, 0 as CMCYOrdVal, 0 CMPYOrdVal ,Sum( pp.Ord_Qty*(pp.rate-pp.Discount+pp.Pack)*po.ExRate) CQCYOrdVal,0 CQPYOrdVal,0 CYOrdVal,0 PYOrdVal
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where  (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where po.Created_Date between fromdate and ToDate ) =
 (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where Dateadd(YY,0,'${date}') between fromdate and ToDate )
Union All
---Curr Quarter Prev Year Order Value
  Select 'CQ PY Order Value' as DataType, 0 as CMCYOrdVal, 0 CMPYOrdVal ,0 CQCYOrdVal,Sum( pp.Ord_Qty*(pp.rate-pp.Discount+pp.Pack)*po.ExRate) CQPYOrdVal,0 CYOrdVal,0 PYOrdVal
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where  (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where po.Created_Date between fromdate and ToDate ) =
 (Select Quarter+'-'+yearname from icSoft.dbo.ST_FinancialYear Where Dateadd(YY,-1,'${date}') between fromdate and ToDate )
 Union All
 ---Curr Year Order Value
  Select 'CY Order Value' as DataType, 0 as CMCYOrdVal, 0 CMPYOrdVal ,0 CQCYOrdVal,0 CQPYOrdVal,Sum( pp.Ord_Qty*(pp.rate-pp.Discount+pp.Pack)*po.ExRate) CYOrdVal,0 PYOrdVal
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where (Select yearname from icSoft.dbo.ST_FinancialYear Where Convert(Date,po.Created_Date,11) between fromdate and ToDate ) =
 (Select yearname from icSoft.dbo.ST_FinancialYear Where Dateadd(YY,0,'${date}') between fromdate and ToDate )
 Union All
 ---Prev Year Order Value
  Select 'PY Order Value' as DataType, 0 as CMCYOrdVal, 0 CMPYOrdVal ,0 CQCYOrdVal,0 CQPYOrdVal,0 CYOrdVal,Sum( pp.Ord_Qty*(pp.rate-pp.Discount+pp.Pack)*po.ExRate) PYOrdVal
From Purchase po inner join purchaseproduct pp on pp.poid =po.poid inner join rawmaterial rm on rm.rawmatid = pp.prodid
inner join invent_grntype gt on gt.GrnTypeId = rm.GrnTypeId
inner join customer c on c.custid = po.custid left outer join grade g on g.gradeid = pp.GradeID 
left outer join Invent_Rawmaterial rmadn on rmadn.Af_ID = rm.RawMatID
left outer join ST_HTCondition ht on ht.HTID=rmadn.[HT Condition]
left outer join ST_SupplyCondition sc on sc.SCID = rmadn.[Supply Condition]
Where (Select yearname from icSoft.dbo.ST_FinancialYear Where Convert(Date,po.Created_Date,11) between fromdate and ToDate ) =
 (Select yearname from icSoft.dbo.ST_FinancialYear Where Dateadd(YY,-1,'${date}') between fromdate and ToDate )) v
`;

console.log(querry);


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

const quotation_summary = async (req, res) => {
  const date = req.query.date ? req.query.date : new Date().toISOString().split('T')[0];

  console.log(date);

  const querry = `select sum(SubQty) as SubQty, Round(sum(SubValue)/100000,2) as SubValue, sum(AcpQty) as Acpqty, Round(sum(AcpValue)/100000,2) as AcpValue, sum(RejQty) as RejQty, Round(sum(RejValue)/100000,2) as RejValue from (
select count(QuotationProdID) as SubQty , sum(qp.Qty*qp.Price_Unit) as SubValue, 0 as AcpQty, 0 as AcpValue,0 as RejQty, 0 as RejValue
 from quotation_Product qp inner join quotations q on qp.QuotID = q.QuotID
 where QuotDate > '${date}'
UNION ALL
select 0 as SubQty, 0 as SubValue, count(pp.QuotationProdId) as AcpQty, sum(qp.Qty*qp.Price_Unit) as AcpValue, 0 RejQty, 0 as RejValue
 from purchaseproduct pp inner join Purchase p on p.POID = pp.poid
 inner join quotation_Product qp on qp.QuotationProdID = pp.QuotationProdId
 where pp.QuotationProdId <> 0 and p.PODate > '${date}' 
 UNION ALL
select  0 as SubQty, 0 as SubValue, 0 as AcpQty, 0 as AcpValue, count(QuotationProdID) as RejQty, sum(qp.Qty*qp.Price_Unit) as RejValue
from quotation_Product qp inner join quotations q on qp.QuotID = q.QuotID
 where Price_Unit = 0 and QuotDate > '${date}' ) v
`;

console.log(querry);


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

const enquiry_summary = async (req, res) => {

  const date = req.query.date ? req.query.date : new Date().toISOString().split('T')[0];

  console.log(date);

  const querry = `select 'Enquiry' Module,
	   count(case when Date_of_Enquiry = '${date}' then IntEnqRefNo end) as  Today,
	   count(case when Date_of_Enquiry >= DATEADD(week, -1, '${date}')then IntEnqRefNo end) as LastoneWeek,
	   count(case when Date_of_Enquiry >= DATEADD(month, -1, '${date}')then IntEnqRefNo end) as LastoneMonth,
	   count(case when Date_of_Enquiry >= DATEADD(Year, -1, '${date}')then IntEnqRefNo end) as LastoneYear ,
	   count(case when Date_of_Enquiry = '${date}' and  enquirysentstatus = 'Hisotry' then IntEnqRefNo end) as  RejToday,
	   count(case when Date_of_Enquiry >= DATEADD(week, -1, '${date}') and  enquirysentstatus = 'History' then IntEnqRefNo end) as RejLastoneWeek,
	   count(case when Date_of_Enquiry >= DATEADD(month, -1, '${date}') and  enquirysentstatus = 'History'then IntEnqRefNo end) as RejLastoneMonth,
	   count(case when Date_of_Enquiry >= DATEADD(Year, -1, '${date}') and  enquirysentstatus = 'History'then IntEnqRefNo end) as RejLastoneYear
	    from enquiry
`;

console.log(querry);


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
  searchPO,
  sales_details,
  quatation_details,
  enquiry_details,
  due_details,
  order_value_details,
  sales_summary,
  pending_sales_summary,
  order_booked_summary,
  quotation_summary,
  enquiry_summary
}
