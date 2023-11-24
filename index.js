const express = require("express");
const router = require("./src/data/routes");
const dashboardRouter=require("./src/dashboard/dashboardroutes");
const databaseRouter=require("./src/config/configroutes")
require('dotenv').config()
// console.log(process.env)


// const drouter = require("./routes/dailyroute");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

var corOption = {
    origin: ["https://vikrant-dashboard-1.vercel.app","https://sidtech.vercel.app", "http://localhost:5173","https://vikranta-dashboard-new.vercel.app", ,"http://127.0.0.1:5173"]
};


app.use(cors(corOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use("/fillingdata", router);
app.use("/dashboard",dashboardRouter)
app.use("/database",databaseRouter)
// app.use("/time", drouter);
app.get("", (req, res) => {
    res.send("hello from api" );
});

app.listen(port,() => {
    console.log(`server is listening to the port number :- ${port} running on http://localhost:${port}`);
});
