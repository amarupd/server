const dailyController=require('./configController')

const router=require('express').Router()


router.post("/logindb",dailyController.login)

router.post("/logoutdb",dailyController.logout)


module.exports=router;