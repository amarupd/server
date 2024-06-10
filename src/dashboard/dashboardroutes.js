const dailyController=require('./dashboardcontroller')
const details=require('./details')
const update=require('./update_invent_purchase')



const router=require('express').Router()


router.get("/fetchData",dailyController.fetchData)

router.get("/basicvalue",dailyController.BasicValue)

router.get("/basicValuerange",dailyController.BasicValuerange)

router.get("/searchpo",dailyController.searchPO)
 
router.get("/sales_details",details.sales_details)

router.get("/quatation_details",details.quatation_details)

router.get("/enquiry_details",details.enquiry_details)

router.get("/due_details",details.due_details)

router.get("/order_value_details",details.order_value_details)

router.get("/sales_summary",details.sales_summary)

router.get("/pending_sales_summary",details.pending_sales_summary)

router.get("/order_booked_summary",details.order_booked_summary)

router.get("/quotation_summary",details.quotation_summary)

router.get("/enquiry_summary",details.enquiry_summary)

router.post("/approve_reject",update.approve_reject)



//router.post("/changePassword",dailyController.otpverify)
module.exports=router;