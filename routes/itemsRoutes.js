const express = require("express");
const itemController = require("./../controllers/itemController");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");

const router = express.Router();

// GET all Items
router.get("/", itemController.getItems);

//GET a single Item
router.get("/:id", itemController.getItem);

// for admin  //

// ADD NEW PRODUCT
router.post(
  "/addproduct",
  authController.requireAuth,
  authController.restrictTo,
  itemController.createNewItem_post
);

// DELETE ITEM
router.post(
  "/deleteproduct",
  authController.requireAuth,
  authController.restrictTo,
  itemController.deleteItem_post
);

// update a Item
router.post(
  "/editproduct",
  authController.requireAuth,
  authController.restrictTo,
  itemController.updateItem_post
);

module.exports = router;
