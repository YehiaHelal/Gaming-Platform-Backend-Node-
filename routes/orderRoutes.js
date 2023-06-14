const express = require("express");
const orderController = require("./../controllers/orderController");
const authController = require("./../controllers/authController");

const router = express.Router();

// const router = express.Router();

// GET all orders
router.post(
  "/getuserorders",
  authController.requireAuth,
  orderController.getuserorders_post
);

// create a new order
router.post(
  "/cartorder",
  authController.requireAuth,
  orderController.cartOrder_post
);

// update or add Item image to S3 bucket
router.post(
  "/itemimageupdate",
  // authController.requireAuth,
  // userController.uploadUserPhoto_post,
  // userController.imageUploader.single("photo"),
  orderController.resizeItemPhoto
);

// Restricted to admin //

//get all orders
router.post(
  "/getallorders",
  authController.requireAuth,
  authController.restrictTo,
  orderController.getAllOrders_post
);

// UPDATE ORDER
router.post(
  "/updateOrder",
  authController.requireAuth,
  authController.restrictTo,
  orderController.editOrder_post
);

// DELETE ORDER
router.post(
  "/deleteorder",
  authController.requireAuth,
  authController.restrictTo,
  orderController.deleteOrder_post
);

// Mark ORDER Completed
router.post(
  "/markordercompleted",
  authController.requireAuth,
  authController.restrictTo,
  orderController.markOrderCompleted_post
);

// ADD Note to Order
router.post(
  "/orderaddnote",
  authController.requireAuth,
  authController.restrictTo,
  orderController.OrderAddNote_post
);

// //GET a single order
// router.get("/:id", getorder);

// // POST a new order
// router.post("/", createorder);

// // DELETE a order
// router.delete("/:id", deleteorder);

// module.exports = router;

module.exports = router;
