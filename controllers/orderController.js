const Order = require("../models/orderModel");
const mongoose = require("mongoose");
const User = require("../models/userModel");

const sharp = require("sharp");
const AWS = require("aws-sdk");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const fileUpload = require("express-fileupload");
const { S3Client } = require("@aws-sdk/client-s3");

// create new user
const cartOrder_post = async (req, res) => {
  //  console.log(req.body.OrderDetails);
  const { orderProducts, orderTotalValue } = req.body.submission.OrderDetails; // from the req.body sent from the frontend

  const getuserData = await User.findOne({ email: res.locals.user.email });

  // console.log(orderProducts, orderTotalValue);
  // console.log(req.current);
  // console.log(res.locals.user);
  // console.log(res.locals.user.email);

  // console.log("data");

  // console.log(orderProducts);
  // console.log(orderTotalValue);

  try {
    const order = await Order.create({
      orderProducts,
      orderTotalValue,
      user: res.locals.user.email,
      userData: getuserData,
    });
    // console.log(order);

    // console.log(order);

    res.status(200).json({ message: order });

    // res.status(200).json({ message: "order placed and on it's way" });
  } catch (error) {
    res.status(400).json({ error: "there was an error" });
  }
};

// get user orders
const getuserorders_post = async (req, res) => {
  const userorders = await Order.find({ user: res.locals.user.email });
  // console.log(userorders);

  //  console.log(res.locals.user.email);

  if (!userorders) {
    return res.status(400).json({ error: "no user was found" });
  }

  // console.log(req.body.OrderDetails);
  // const { orderProducts, orderTotalValue } = req.body.OrderDetails; // from the req.body sent from the frontend

  // try {
  //   const order = await Order.create({
  //     orderProducts,
  //     orderTotalValue,
  //     user: res.locals.user.email,
  //   });

  res.status(200).json({ message: "all your orders", orders: userorders });
  // } catch (error) {
  //   res.status(400).json({ error: "there was an error" });
  // }
};

// for Admin //

// get all orders
const getAllOrders_post = async (req, res) => {
  const orders = await Order.find({}).sort({});

  // a normal cookie send
  // res.cookie("JWT-Test", false, { maxAge: 1000 * 60 * 60 * 24 }); - // setting the age for it to stay even if the browser was closed
  // 1000 milisecond * 60 sec * 60 minute * 24 hour

  res.status(200).json(orders); // res.status 200 means ok
};

// for Item Image adding
const editOrder_post = async (req, res) => {
  // the item selected to be updated

  // the updated data
  // console.log(req.body);

  // updating order address
  if (req.body.address) {
    // console.log("trying now");
    try {
      const updatedorderAddress = await Order.findOneAndUpdate(
        { ordernumber: +req.body.selectedOrder },
        {
          $set: {
            "userData.address": req.body.address,
          },
        },
        // { address: req.body.address },
        {
          new: true,
        }
      );
    } catch (error) {
      res.status(400).json({ error: "Error updating address" });
    }
  }

  // updating order price
  if (req.body.price) {
    try {
      const updatedorderPrice = await Order.findOneAndUpdate(
        { ordernumber: +req.body.selectedOrder },

        { orderTotalValue: req.body.price },
        {
          new: true,
        }
      );
    } catch (error) {
      res.status(400).json({ error: "Error updating price" });
    }
  }

  // updating order user mobile number
  if (req.body.mobile) {
    try {
      const updatedorderMobileno = await Order.findOneAndUpdate(
        { ordernumber: +req.body.selectedOrder },
        {
          $set: {
            "userData.mobilenumber": req.body.mobile,
          },
        },
        // { address: req.body.address },
        {
          new: true,
        }
      );
    } catch (error) {
      res.status(400).json({ error: "Error updating mobile number" });
    }
  }

  // updating the order

  // finding the selected order
  // const order = await Order.findOne({ ordernumber: +req.body.selectedOrder });
  // console.log(order);

  // a normal cookie send
  // res.cookie("JWT-Test", false, { maxAge: 1000 * 60 * 60 * 24 }); - // setting the age for it to stay even if the browser was closed
  // 1000 milisecond * 60 sec * 60 minute * 24 hour

  res.status(200).json({ message: "update order" }); // res.status 200 means ok
};

// Delete Order
const deleteOrder_post = async (req, res) => {
  // the item selected to be updated

  // the updated data
  // console.log(req.body.submission.ordernumber);

  const order = await Order.findOneAndDelete({
    ordernumber: req.body.submission.ordernumber,
  });

  if (!order) {
    return res.status(400).json({ error: "Error, No such Order found" });
  }

  res.status(200).json({ message: "order deleted" });
};

// Marking Order as Completed

const markOrderCompleted_post = async (req, res) => {
  // the item selected to be updated
  // the updated data

  // order number to find it
  // console.log(req.body.submission);

  // order state completed or not
  // console.log(req.body.order.opened);

  // if this url is clicked if the item is opened is true will set it false, and if false will reverse it

  // Marking Order completed user image

  const orderMarkcompleted = await Order.findOne({
    ordernumber: req.body.submission.order.ordernumber,
    opened: true,
  });

  if (orderMarkcompleted) {
    const orderMarkcompletedAction = await Order.findOneAndUpdate(
      { ordernumber: req.body.submission.order.ordernumber },
      { opened: false },
      {
        new: true,
      }
    );

    // console.log("marked complete");
  }

  if (!orderMarkcompleted) {
    const orderMarkNotcompletedReverseAction = await Order.findOneAndUpdate(
      { ordernumber: req.body.submission.order.ordernumber, opened: false },
      { opened: true },
      {
        new: true,
      }
    );

    // console.log("reverse");
    // const orderMarkcompletedAction = await Order.findOneAndUpdate(
    //   { ordernumber: req.body.submission.order.ordernumber },
    //   { opened: false },
    //   {
    //     new: true,
    //   }
    // );
  }

  // const orderMarkNotcompletedReverse = await Order.findOne({
  //   ordernumber: req.body.submission.order.ordernumber,
  //   opened: false,
  // });

  // console.log(orderMarkNotcompletedReverse);

  // if (orderMarkNotcompletedReverse) {
  //   const orderMarkNotcompletedReverseAction = await Order.findOneAndUpdate(
  //     { ordernumber: req.body.submission.order.ordernumber },
  //     { opened: true },
  //     {
  //       new: true,
  //     }
  //   );
  // }

  // console.log(orderMarkNotcompletedReverse);

  // if (!order) {
  //   return res.status(400).json({ error: "Error" });
  // }

  // Marking Order completed user image

  // if (!orderMarkcompleted && !orderMarkNotcompletedReverse) {
  //   return res.status(400).json({ error: "Error" });
  // }

  // console.log(order);
  // const order = await Order.findOneAndDelete({
  //   ordernumber: req.body.submission.submission.ordernumber,
  // });

  // if (!order) {
  //   return res.status(400).json({ error: "Error, No such Order found" });
  // }

  res.status(200).json({ message: "order marked completed " });
};

// ADD Note to Order

const OrderAddNote_post = async (req, res) => {
  // order selected to add note to
  // console.log(req.body.submission);

  // note wanted to be added
  // console.log(req.body.submission.note);

  // order state completed or not
  // console.log(req.body.submission.order.opened);

  // Adding note the order

  const order = await Order.findOneAndUpdate(
    { ordernumber: req.body.submission.ordernumber },
    { note: req.body.submission.note },
    {
      new: true,
    }
  );

  if (!order) {
    return res.status(400).json({ error: "Error" });
  }

  // console.log(order);

  // console.log(order);

  res.status(200).json({ message: "Note Add to Order" });
};

// for items adding and saving it to the S3 bucket
const resizeItemPhoto = async (req, res, next) => {
  // to get the user email and full data
  // console.log(req.user.email);
  // console.log(res.locals.user);
  // console.log(req.body.submission.name);

  // splitting the user email after @
  // const emailwithoutatsign = req.user.email.split("@")[0];
  // const itemName = req.body.submission.name;
  const itemName = req.files.photo.name.split(".")[0];

  // const itemName = "Black tea";

  // console.log(emailwithoutatsign);

  // full file name senf from frontend
  // console.log(req.files.photo);

  // file name senf from frontend
  // console.log(req.files.photo.data);

  // file name senf from frontend
  // console.log(req.files.photo.name);

  // const path = `./../frontend/public/users/images/${req.user.email}.jpeg`;

  // await sharp(req.file.buffer)
  //   .resize(300, 300)
  //   .toFormat("jpeg")
  //   .jpeg({ quality: 90 });
  // //   .toFile(path);

  const semiTransparentRedPng = await sharp(req.files.photo.data)
    .resize(300, 300)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    // .png()
    .toBuffer();

  // console.log(semiTransparentRedPng);

  AWS.config.update({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    region: process.env.region,
  });

  const s3 = new AWS.S3();

  const fileContent = Buffer.from(semiTransparentRedPng, "binary");

  const params = {
    Bucket: "next-ecommerce-s3",
    // Key: req.files.photo.name,
    Key: `${itemName}.png`,
    Body: fileContent,
    ACL: "public-read",
  };

  s3.upload(params, (err, data) => {
    if (err) {
      throw err;
    }
    res.send({ data: data });
  });

  // updating user image
  // const user = await User.findOneAndUpdate(
  //   { email: res.locals.user.email },
  //   { photo: req.file.originalname },
  //   {
  //     new: true,
  //   }
  // );

  // res.status(200).json({ message: "Image Added Successfully" });
};

module.exports = {
  cartOrder_post,
  getuserorders_post,
  getAllOrders_post,
  resizeItemPhoto,
  editOrder_post,
  deleteOrder_post,
  markOrderCompleted_post,
  OrderAddNote_post,
};
