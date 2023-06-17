const { Router } = require("express");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");

const router = Router();

// so this is esstenailly the middle-ware which is between the frontend React and The Backend DB

// router.get("/signup", ); // to get some info from the backend DB   // we can set the function here or we add the controller for cleaner code

router.post("/signup", userController.createUser_post); // to form/create a doc on the backend DB // we can set the function here or we add the

router.post("/checktoken", authController.checkToken_post);

router.post("/login", userController.loginUser_post); // to get some info from the backend DB // we can set the function here or we add the controller for cleaner code
router.post("/logout", userController.logoutUser_post); // posting here we send just an empty cookie with 1sec timer and message logout done

// get user information
router.post(
  "/profile",
  authController.requireAuth,
  userController.profileDataGet_post
);

// updating user information
router.post(
  "/updateinfo",
  authController.requireAuth,
  userController.updateUser_post
);

// update or add profile image to S3 bucket
// Updated... : Image of User Adding or Updating the Image
router.post(
  "/imageupdate",
  authController.requireAuth,
  // userController.uploadUserPhoto_post,
  // userController.imageUploader.single("photo"),
  userController.imageUserAddUpdate
);

// update or add profile image to S3 bucket
// Updated... : Image Fetch from Backend & sending to frontend
router.post(
  "/imagesendingtofe",
  // authController.requireAuth,
  // userController.uploadUserPhoto_post,
  // userController.imageUploader.single("photo"),
  userController.ImageProfileSendBackToFe
);

// update or add an image
router.post(
  "/contactsend",
  authController.requireAuth,
  userController.saveContact_post
);

// get user name and address data
router.post(
  "/getndata",
  authController.requireAuth,
  userController.getNameData_post
);

// change user password
router.post(
  "/changepassword",
  authController.requireAuth,
  userController.changePassword_post
);

// opening chat with user and starting a new chat
router.post(
  "/openchat",
  // authController.requireAuth,
  userController.openChat_post
);

// getting the messages and for updating the msg app
router.post(
  "/getmessages",
  // authController.requireAuth,
  userController.getMessages_post
);

// receiving messages and dealing with messages
router.post(
  "/sendingchat",
  // authController.requireAuth,
  userController.receiveMessages_post
);

// ///////////////////////////////////////////////////

// for Emails, forget password
router.post(
  "/resetpasswordemail",
  // authController.requireAuth,
  userController.resetpasswordemail_post
);

// for password Reset, forget password
router.post(
  "/resetpassword",
  // authController.requireAuth,
  userController.ResetPasswordwToken_post
);

// for Email order placed confirm Reset, forget password
router.post(
  "/emailorderplaced",
  // authController.requireAuth,
  userController.orderConfirmedemail_post
);

// for Emails, welcome register email
// router.post(
//   "/resetpassword",
//   // authController.requireAuth,
//   userController.resetpasswordemail_post
// );
// for Emails, your order was placed thank you, we will contact u soon
// router.post(
//   "/resetpassword",
//   // authController.requireAuth,
//   userController.resetpasswordemail_post
// );

// Restricted to admin //

//GET ALL users
router.post(
  "/getallusers",
  authController.requireAuth,
  authController.restrictTo,
  userController.getAllUsers_post
);

//Add New User Admin
router.post(
  "/adduseradmin",
  authController.requireAuth,
  authController.restrictTo,
  userController.addUserFromAdmin_post
);

//Add New User Admin
router.post(
  "/updateuserinfo",
  authController.requireAuth,
  authController.restrictTo,
  userController.updateUserInfo_post
);

//Deactivite user
router.post(
  "/deactivateuser",
  authController.requireAuth,
  authController.restrictTo,
  userController.deactivateUser_post
);

// Add Note To User
router.post(
  "/addnotetouser",
  authController.requireAuth,
  authController.restrictTo,
  userController.UserAddNote_post
);

//DELETE user
router.post(
  "/deleteuser",
  authController.requireAuth,
  authController.restrictTo,
  userController.deleteUser_post
);

// Admin Panel Active chat , Get all Active chat

router.post(
  "/activechatpanel",
  authController.requireAuth,
  authController.restrictTo,
  userController.getAllActiveChat_post
);

// Admin Panel Active chat , Admin Replying to chats Message
router.post(
  "/adminsendingchat",
  authController.requireAuth,
  authController.restrictTo,
  userController.AdminSendingMessagesOnActiveChat_post
);

// admin join chat mark for chat
router.post(
  "/adminjoinchat",
  authController.requireAuth,
  authController.restrictTo,
  userController.adminjoinchat_post
);

// admin join chat mark for chat
router.post(
  "/adminmarkchatcomplete",
  authController.requireAuth,
  authController.restrictTo,
  userController.adminmarkchatcomplete_post
);

// add note to chat
router.post(
  "/adminaddnotetochat",
  authController.requireAuth,
  authController.restrictTo,
  userController.adminaddnotetochat_post
);

// mark chat for manger
router.post(
  "/adminmarkformanger",
  authController.requireAuth,
  authController.restrictTo,
  userController.adminmarkformanger_post
);

// block user email in chat
router.post(
  "/adminblockuseremail",
  authController.requireAuth,
  authController.restrictTo,
  userController.adminblockuseremail_post
);

//GET Dashboard general data about users/orders/products/livechats
router.post(
  "/dashboarddata",
  authController.requireAuth,
  authController.restrictTo,
  userController.dashboardData_post
);

module.exports = router;
