const sql = require('mssql/msnodesqlv8');

let config = {
  // server: 'AMAR\\MSSQLSERVER01',
  server:'AMAR\\AMARDUTT',
  database: 'Icsoft',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true,
  },
};

const search = async (req, res) => {
  const querry = `Select c.CustCode, c.CustName,  e.Enq_Ref_No, e.Date_of_Enquiry, e.Due_Date, 
  p.InternalPartNo as Itemcode, sc.CategoryName as itemCategory, P.ProdName+'-'+ ep.ItemDescription as Item, g.Gradename, ep.Qty, emp.EmpName    
  from enquiry e inner join enquiry_product ep on ep.enquiryid = e.enquiryid
  inner join product p on p.prodid = ep.prodid inner join customer c on c.custid = e.custid 
  inner Join Sales_Category sc on sc.CategoryID  =p.CategoryID
  left outer join grade g on g.gradeid = ep.GradeID
  Left outer join employee emp on emp.empid = e.Enq_Originated_By`;

  try {
    await sql.connect(config); // Wait for the database connection to be established
    let request = new sql.Request();
    const data = await request.query(querry); // Wait for the query to complete
    console.log(data);
    // res.send(data.recordset); // Assuming you want to send the query result as a response
  } catch (err) {
    console.error(err);
    // res.status(500).send({
    //   message: err.message || "Some error occurred while retrieving data.",
    // });
  }
};

search();
