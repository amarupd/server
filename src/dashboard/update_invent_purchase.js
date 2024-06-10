const sql = require('mssql');
const config = require("../config/config");

const approve_reject = async (req, res) => {
  const poid = req.body.poid ? req.body.poid : 0;
  if (!poid) {
    return res.status(500).send({
      message: "Select POID first for update or reject",
    });
  }

  let type = req.body.type;
  if (!type) {
    return res.status(400).send({
      message: "Type is required (approve/reject)",
    });
  }

  type = type.toLowerCase();
  let status;
  if (type === "approve") {
    status = 'Acknowledged';
  } else if (type === "reject") {
    status = 'Cancelled';
  } else {
    return res.status(400).send({
      message: "Invalid type (must be 'approve' or 'reject')",
    });
  }

  const query = `UPDATE Invent_Purchase SET postatus = @status WHERE POID = @poid`;

  try {
    await sql.connect(config);
    const request = new sql.Request();
    request.input('status', sql.NVarChar, status);
    request.input('poid', sql.Int, poid);
    const data = await request.query(query);
    res.send({message:`Updated POID : ${poid} invent_purchase with postatus ${status} `});
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: err.message || "Some error occurred while updating the data.",
    });
  }
};

module.exports = {
  approve_reject,
};
