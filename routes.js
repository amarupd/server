const dailyController=require('./controller')

const drouter=require('express').Router()

drouter.get("/fill",dailyController.search)
drouter.post("/fill",dailyController.insert)


//drouter.post("/changePassword",dailyController.otpverify)
module.exports=drouter;