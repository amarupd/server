const express = require("express");
const router = require("./routes");


// const drouter = require("./routes/dailyroute");
const cors = require("cors");
const app = express();
const port = process.env.port || 5001;

var corOption = {
    origin: ["https://vikrant-dashboard-1.vercel.app","https://sidtech.vercel.app", "http://localhost:5173","https://vikranta-dashboard-new.vercel.app","https://main--stalwart-tartufo-830372.netlify.app"]
};


app.use(cors(corOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use("/fillingdata", router);
// app.use("/time", drouter);
app.get("", (req, res) => {
    res.send("hello from api" );
});

app.listen(port, () => {
    console.log(`server is listening to the port number :- ${port} running on http://localhost:${port}`);
});
