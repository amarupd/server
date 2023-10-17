const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5001;

const data = [
  {
    "CustCode": "100004",
    "CustName": "ESCORT KUBOTA LIMITED",
    "Enq_Ref_No": "68465135-1",
    "Date_of_Enquiry": "2023-09-18T16:16:46.743Z",
    "Due_Date": "2023-09-18T16:16:46.743Z",
    "Itemcode": "10000001",
    "itemCategory": "Spare Division",
    "Item": "TOOL BOX-",
    "Gradename": "None",
    "Qty": 6541,
    "EmpName": "Ashish Arvindrai Shah"
  },
  {
    "CustCode": "100004",
    "CustName": "ESCORT KUBOTA LIMITED",
    "Enq_Ref_No": "6843535-1",
    "Date_of_Enquiry": "2023-09-18T16:16:46.743Z",
    "Due_Date": "2023-09-18T16:16:46.743Z",
    "Itemcode": "10013",
    "itemCategory": "Spare Division",
    "Item": "NUT FRONT WHEEL M16X1.5X17 (ADICO PART NO 010013)-",
    "Gradename": "None",
    "Qty": 151,
    "EmpName": "Ashish Bhagvanjibhai Makvana"
  }
];

app.use(cors());

app.get("/data", (req, res) => {
    console.log("hitted this api");
  res.json(data);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
