const dailyController=require('./dashboardcontroller')

const router=require('express').Router()


router.get("/fetchData",dailyController.fetchData)

router.get("/basicvalue",dailyController.BasicValue)

router.get("/basicValuerange",dailyController.BasicValuerange)

router.get("/searchpo",dailyController.searchPO)





//router.post("/changePassword",dailyController.otpverify)
module.exports=router;