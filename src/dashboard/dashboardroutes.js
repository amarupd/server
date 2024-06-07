const dailyController=require('./dashboardcontroller')

const router=require('express').Router()


router.get("/fetchData",dailyController.fetchData)

router.get("/basicvalue",dailyController.BasicValue)

router.get("/basicValuerange",dailyController.BasicValuerange)

router.get("/searchpo",dailyController.searchPO)
 
router.get("/sales_details",dailyController.sales_details)

router.get("/quatation_details",dailyController.quatation_details)

router.get("/enquiry_details",dailyController.enquiry_details)

router.get("/due_details",dailyController.due_details)

router.get("/order_value_details",dailyController.order_value_details)

router.get("/sales_summary",dailyController.sales_summary)

router.get("/pending_sales_summary",dailyController.pending_sales_summary)

router.get("/order_booked_summary",dailyController.order_booked_summary)

router.get("/quotation_summary",dailyController.quotation_summary)

router.get("/enquiry_summary",dailyController.enquiry_summary)


//router.post("/changePassword",dailyController.otpverify)
module.exports=router;