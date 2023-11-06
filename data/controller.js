const sql = require('mssql');

const jwt = require("jsonwebtoken");

const config=require("../config/config")

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
    res.send(data.recordset); // Assuming you want to send the query result as a response
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving data.",
    });
  }
};

const insert1 = async (req, res) => {
    const querry = `INSERT INTO YourTableName (PaymentTerms, LDClause, QAPNeeded, MaterialGrade, HTConditions, SupplyConditions, DeliveryConditions, DrawingNo, TestPcs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
    try {
      await sql.connect(config); // Wait for the database connection to be established
      let request = new sql.Request();
      const data = await request.query(querry); // Wait for the query to complete
      console.log(data);
      res.status(200).send(data.recordset); // Assuming you want to send the query result as a response
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving data.",
      });
    }
  };

//   const insert = async (req, res) => {
//     const { PaymentTerms, LDClause, QAPNeeded, MaterialGrade, HTConditions, SupplyConditions, DeliveryConditions, DrawingNo, TestPcs } = req.body;

//     const query = `
//         INSERT INTO St_Enquiry_Review (PaymentTerms, LDClause, QAPNeeded, MaterialGrade, HTConditions, SupplyConditions, DeliveryConditions, DrawingNo, TestPcs)
//         VALUES (${PaymentTerms}, ${LDClause}, ${QAPNeeded}, ${MaterialGrade}, ${HTConditions}, ${SupplyConditions},${DeliveryConditions}, ${DrawingNo}, ${TestPcs})
//     `;

//     try {
//         await sql.connect(config); // Wait for the database connection to be established
//         let request = new sql.Request();
//         const result = await request.query(query); // Wait for the query to complete
//         console.log(result);
//         res.status(200).send(result.recordset); // Assuming you want to send the query result as a response
//     } catch (err) {
//         console.error(err);
//         res.status(500).send({
//             message: err.message || 'Some error occurred while inserting data.',
//         });
//     }
// };

const insert = async (req, res) => {
    const { PaymentTerms, LDClause, QAPNeeded, MaterialGrade, HTConditions, SupplyConditions, DeliveryConditions, DrawingNo, TestPcs, CustCode} = req.body;

    const insertQuery = `
        INSERT INTO St_Enquiry_Review (PaymentTerms, LDClause, QAPNeeded, MaterialGrade, HTConditions, SupplyConditions, DeliveryConditions, DrawingNo, TestPcs,CustCode)
        VALUES (@PaymentTerms, @LDClause, @QAPNeeded, @MaterialGrade, @HTConditions, @SupplyConditions, @DeliveryConditions, @DrawingNo, @TestPcs,@CustCode)
    `;

    const selectQuery = `
        SELECT * FROM St_Enquiry_Review WHERE DrawingNo = @DrawingNo
    `;

    try {
        await sql.connect(config); // Wait for the database connection to be established
        let request = new sql.Request();

        // Insert the data
        request.input('PaymentTerms', sql.NVarChar, PaymentTerms);
        request.input('LDClause', sql.NVarChar, LDClause);
        request.input('QAPNeeded', sql.NVarChar, QAPNeeded);
        request.input('MaterialGrade', sql.NVarChar, MaterialGrade);
        request.input('HTConditions', sql.NVarChar, HTConditions);
        request.input('SupplyConditions', sql.NVarChar, SupplyConditions);
        request.input('DeliveryConditions', sql.NVarChar, DeliveryConditions);
        request.input('DrawingNo', sql.NVarChar, DrawingNo);
        request.input('TestPcs', sql.NVarChar, TestPcs);
        request.input('CustCode', sql.NVarChar, CustCode);


        const insertResult = await request.query(insertQuery); // Wait for the insert query to complete

        // Retrieve the inserted data
        request = new sql.Request();
        request.input('DrawingNo', sql.NVarChar, DrawingNo);
        const selectResult = await request.query(selectQuery); // Wait for the select query to complete

        console.log(insertResult);
        res.status(200).send({ message: "Data inserted successfully", data: selectResult.recordset }); // Send the inserted data in the response
    } catch (err) {
        console.error(err);
        res.status(500).send({
            message: err.message || 'Some error occurred while inserting data.',
        });
    }
};




const USER_LOGIN = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const EMAIL= 'vivek@sidtech.net'
        const PASSWORD= 'vivek';
        const NAME = 'Super Admin'
        const ID="65047d04c8c3f02754fb9737"
        const JWT_SECRET = 'vivek'

        // Logic for Super Admin
        if (EMAIL === email && PASSWORD === password) {
            const superAdmin = {
                _id: ID,
                fullname: NAME,
                email,
                mobile: 7272096364,
                user_access: ["all"],
                status: true,
            };
            const token = jwt.sign({ id: superAdmin._id }, JWT_SECRET);
            return res.status(200).json({ token, user: superAdmin });
        }
        else{
          return res.status(400).json({msg: "user doesn't exist"})        }

    } catch (error) {
        return next(error)
    }
}
// Route to fetch all data

module.exports = {
    search,
    insert,
    USER_LOGIN
}