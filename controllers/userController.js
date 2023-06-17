const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Chat = require("../models/chatModel");
const Item = require("../models/itemModel");
const Contact = require("../models/contactModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const { promisify } = require("util");
const { readFileSync } = require("fs");

const http = require("http");
const fs = require("fs");
const express = require("fs");

// for images and S3
const AWS = require("aws-sdk");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const fileUpload = require("express-fileupload");
const { S3Client } = require("@aws-sdk/client-s3");

const mailgun = require("mailgun-js")({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

// jsonwebtoken -- create token
const maxAge = 30 * 24 * 60 * 60; // 90 days token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_Secret, { expiresIn: maxAge });
};

// create new user
const createUser_post = async (req, res) => {
  const { email, password, name, address } = req.body.submission; // from the req.body sent from the frontend

  // name
  // here we are using de-structing assigning name and email and password to , from the request body we got.

  if (password.lenth < 6) {
    return res
      .status(400)
      .json({ error: "Minimum password length is 6 characters", emptyFields });
  }

  let emptyFields = [];

  // if (!name) {
  //   emptyFields.push("name");
  // }
  if (!email) {
    emptyFields.push("email");
  }
  if (!password) {
    emptyFields.push("password");
  }
  if (!name) {
    emptyFields.push("name");
  }
  if (!address) {
    emptyFields.push("name");
  }

  if (emptyFields > 0) {
    return res
      .status(400)
      .json({ error: "please fill in all the fields", emptyFields });
  }

  const checkIfUserExist = await User.findOne({ email });
  if (checkIfUserExist) {
    return res.status(400).json({ error: "there is an existing user" });
  }

  try {
    const user = await User.create({ email, password, name, address });
    // jwt cookie send
    // const token = createToken(user._id);
    // res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 }); // this maxAge is in milisecond while jwt is in seconds maxage

    // sending a cookie response ..
    // res.cookie("Hi", true);

    // after we send a jwt token for the browser-frontend
    res.status(200).json({ message: "user created" });
  } catch (error) {
    res.status(400).json({ error: "please fill in all the fields" });
  }
};

// login a user and send back a cookie and the user&token in a message back
const loginUser_post = async (req, res) => {
  const { email, password } = req.body.submission;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: "No such user found" });
  }

  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.status(400).json({ error: "incorrect password" });
    }
  }

  //  jwt cookie send // sending the cookie from here
  const token = createToken(user._id);

  // res.cookie("jwt", token, {
  //   httpOnly: true,
  //   maxAge: maxAge * 1000,
  // });
  // this maxAge is in milisecond while jwt is in seconds maxage
  // res.cookie("jwt", token, {
  //   httpOnly: true,
  //   maxAge: maxAge * 1000,
  //   // sameSite: "none",
  // }); // this maxAge is in milisecond while jwt is in seconds maxage

  // sending a cookie response ..
  // res.cookie("Hi", true);

  // after we send a jwt token for the browser-frontend
  // send the token and user email as data from here
  res.status(200).json({ user: user.email, token });
};

const profileDataGet_post = async (req, res) => {
  // we already have the current user and everything from the check auth protect and we assigned the user data
  // to inside the req itself which is passed to here
  // the req.current , res.locals will be passed to the next middleware so we have them .

  // console.log(req.current);
  // console.log(res.locals.user);

  res.status(200).json({ user: res.locals.user });
};

// loggingout user - we send just an empty cookie with 1sec timer and message "logout done"
const logoutUser_post = async (req, res) => {
  //

  // sending the empty 1sec expirey data cookie to replace the jwt on the browser
  // res.cookie("jwt", "", { maxAge: 10 }); // this works in second so this means 1 sec

  res.status(200).json({ message: "logout done" });
};

////////////////////////////

// update user data

const updateUser_post = async (req, res) => {
  // console.log(req.user);
  //  console.log(res.locals.user.email);

  const { name, address } = req.body.submission;

  // console.log(name, address);

  const user = await User.findOneAndUpdate(
    { email: res.locals.user.email },
    { name: name, address: address },
    {
      new: true,
    }
  );

  if (!user) {
    return res.status(400).json({ error: "Error" });
  }

  // console.log(user);

  // return res.status(404).json({ error: "No such user" });

  // const user = await User.findOneAndUpdate({ _id: id }, { ...req.body });

  // if (!user) {
  //   return res.status(400).json({ error: "No such user" });
  // }

  res.status(200).json({ user: res.locals.user, message: { user } });
};

// update or add a user Image

// Image upload

// const multerConfig = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, "../backend/public");
//   },

//   filename: (req, file, callback) => {
//     if (file.mimetype.split("/")[0] === "image") {
//       const ext = file.mimetype.split("/")[1];

//       // callback(null, `image-${Date.now()}.${ext}`);
//       callback(null, `image-${file.path}.${ext}`);

//       console.log(`image-${file.path}.${ext}`);
//     } else {
//       return callback("Only images are allowed!");

//       // return callback(new Error("Only images are allowed!"));
//     }
//     // file.originalname = "error";
//     // console.log(file.originalname);
//     // console.log(file.originalname);

//     // callback(null, "");

//     // res.status(400).json({ error: "Only images are allowed!" });
//   },
// });

// const upload = multer({ storage: multerConfig });

// const uploadUserPhoto_post = upload.single("photo");

// const resizeUserPhoto = async (req, res, next) => {
//   console.log(req.file);
//   // console.log(req.file);
//   // if (!req.file) return next();

//   // req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

//   await sharp()
//     .resize({ width: 500, height: 500 })
//     // .toFormat("jpeg")
//     // .jpeg({ quality: 90 })
//     .toFile(`./backend/public/${req.file.originalname}`);

//   res.status(200).json({ message: "Image done" });
// };

///////////////

// for image handling
// for multer

// const storage = multer.memoryStorage();

// const filter = (req, file, cb) => {
//   if (file.mimetype.split("/")[0] === "image") {
//     cb(null, true);
//   } else {
//     // cb(new Error("Only images are allowed!"));
//     return callback(new Error("Only images are allowed!"));
//   }
// };

// const imageUploader = multer({
//   storage,
//   fileFilter: filter,
// });

// without multer and using only sharp

const imageUserAddUpdate = async (req, res, next) => {
  // to get the user email and full data
  // console.log(req.user.email);
  // console.log(res.locals.user);

  // splitting the user email after @
  // const emailwithoutatsign = req.user.email.split("@")[0];

  // console.log(emailwithoutatsign);

  // full file name senf from frontend
  // console.log(req.files.photo);

  // file name senf from frontend
  // console.log(req.files.photo.data);

  // file name senf from frontend
  // console.log(req.files.photo.name);

  //buffer
  // console.log(req.files.photo.data);

  // `${process.cwd()}/public/users/devyehia@gmail.com.jpeg`;

  // const pathlocationth = `${process.cwd()}/public/users/${req.user.email}.jpeg`;

  // console.log(pathlocationth);

  // const pathlocationth = `./../public/users/${req.user.email}.jpeg`;

  const pathlocationth = `${process.cwd()}/public/users/${req.user.email}.jpeg`;

  await sharp(req.files.photo.data)
    .resize(300, 300)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(pathlocationth);

  res
    .status(200)
    .json({ message: `${process.cwd()}/public/users/${req.user.email}.jpeg` });

  // const semiTransparentRedPng = await sharp(req.files.photo.data)
  //   .resize(300, 300)
  //   .toFormat("jpeg")
  //   .jpeg({ quality: 90 })
  //   // .png()
  //   .toBuffer();

  // uploading to s3

  // AWS.config.update({
  //   accessKeyId: process.env.accessKeyId,
  //   secretAccessKey: process.env.secretAccessKey,
  //   region: process.env.region,
  // });

  // const s3 = new AWS.S3();

  // const fileContent = Buffer.from(semiTransparentRedPng, "binary");

  // const params = {
  //   Bucket: "next-ecommerce-s3",
  //   // Key: req.files.photo.name,
  //   Key: `${emailwithoutatsign}.png`,
  //   Body: fileContent,
  //   ACL: "public-read",
  // };

  // s3.upload(params, (err, data) => {
  //   if (err) {
  //     throw err;
  //   }
  //   res.send({ data: data });
  // });

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

// for items adding
// const resizeItemPhoto = async (req, res, next) => {
//   // to get the user email and full data
//   // console.log(req.user.email);
//   // console.log(res.locals.user);
//   // console.log(req.body.submission.name);

//   // splitting the user email after @
//   // const emailwithoutatsign = req.user.email.split("@")[0];
//   const itemName = req.body.submission.name

//   // console.log(emailwithoutatsign);

//   // full file name senf from frontend
//   console.log(req.files.photo);

//   // file name senf from frontend
//   console.log(req.files.photo.data);

//   // file name senf from frontend
//   console.log(req.files.photo.name);

//   // const path = `./../frontend/public/users/images/${req.user.email}.jpeg`;

//   // await sharp(req.file.buffer)
//   //   .resize(300, 300)
//   //   .toFormat("jpeg")
//   //   .jpeg({ quality: 90 });
//   // //   .toFile(path);

//   const semiTransparentRedPng = await sharp(req.files.photo.data)
//     .resize(600, 600)
//     .toFormat("jpeg")
//     .jpeg({ quality: 90 })
//     // .png()
//     .toBuffer();

//   console.log(semiTransparentRedPng);

//   AWS.config.update({
//      accessKeyId: process.env.accessKeyId,
// secretAccessKey: process.env.secretAccessKey,
// region: process.env.region,
//   });

//   const s3 = new AWS.S3();

//   const fileContent = Buffer.from(semiTransparentRedPng, "binary");

//   const params = {
//     Bucket: "next-ecommerce-s3",
//     // Key: req.files.photo.name,
//     Key: `${itemName}.png`,
//     Body: fileContent,
//     ACL: "public-read",
//   };

//   s3.upload(params, (err, data) => {
//     if (err) {
//       throw err;
//     }
//     res.send({ data: data });
//   });

//   // updating user image
//   // const user = await User.findOneAndUpdate(
//   //   { email: res.locals.user.email },
//   //   { photo: req.file.originalname },
//   //   {
//   //     new: true,
//   //   }
//   // );

//   // res.status(200).json({ message: "Image Added Successfully" });
// };

// const itemtype = mime.lookup("req.files.photo"); // 'application/json'

// console.log(itemtype);

// res.status(200).json({ message: "Image Added Successfully" });

// const semiTransparentRedPng = await sharp(req.files.photo.data)
//   .png()
//   .toBuffer();

// console.log(semiTransparentRedPng);

// res.status(200).json({ message: "Image Added Successfully" });

// for image uploads S3

// const resizeUserPhotoAndUpload = async (req, res, next) => {
//   // to get the user email and full data
//   // console.log(req.user.email);
//   // console.log(res.locals.user);

//   // console.log(req.file);

//   const path = `./../frontend/public/users/images/${req.user.email}.jpeg`;

//   await sharp(req.file.buffer)
//     .resize(300, 300)
//     .toFormat("jpeg")
//     .jpeg({ quality: 90 })

//     .toFile(path);
//   //   .toBuffer();

//   // res.status(200).json({ message: updatedImage });

//   // const semiTransparentRedPng = await sharp().png().toBuffer();

//   res.status(200).json({ message: "done" });

//   // AWS.config.update({
//   accessKeyId: process.env.accessKeyId,
// secretAccessKey: process.env.secretAccessKey,
// region: process.env.region,
//   // });

//   // const s3 = new AWS.S3();

//   // const fileContent = Buffer.from(req.files.photo.data, "binary");

//   // const params = {
//   //   Bucket: "next-ecommerce-s3",
//   //   Key: req.files.photo.name,
//   //   Body: fileContent,
//   //   ACL: "public-read",
//   // };

//   // s3.upload(params, (err, data) => {
//   //   if (err) {
//   //     throw err;
//   //   }
//   //   res.send({ data: data });
//   // });

//   ////////////////////////////////
//   // fs.readFile("public/image1.png", function (err, image) {
//   //   if (err) throw err; // Fail if the file can't be read.
//   //   // http.createServer(function(req, res) {
//   //   //   res.writeHead(200, {'Content-Type': 'image/jpeg'})
//   //   //   res.end(data) // Send the file data to the browser.
//   //   // }).listen(8124)
//   //   // console.log('Server running at http://localhost:8124/')
//   //   console.log(image);
//   // });

//   // res.send({ data: "loading" });
//   // for mails

//   // updating user image
//   // const user = await User.findOneAndUpdate(
//   //   { email: res.locals.user.email },
//   //   { photo: req.file.originalname },
//   //   {
//   //     new: true,
//   //   }
//   // );

//   // res.status(200).json({ message: "Image Added Successfully" });
//   // next();
//   // res.status(200).json({ message: "Image Added Successfully" });
// };

// sending the image back to the frontend
const ImageProfileSendBackToFe = async (req, res, next) => {
  // to get the user email and full data
  // console.log(req.user.email);
  // console.log(res.locals.user);

  // console.log(req.file);

  const extensionName = "jpeg";

  // const directionname = path.join(
  //   __dirname,
  //   `/../public/users/${req.user.email}.jpeg`
  // );

  // `public/products/`;

  // const directionname = path.join(
  //   __dirname,
  //   `/../public/users/${req.user.email}.jpeg`
  // );

  // const directionnamerr = path.dirname(
  //   "/../public/users/devyehia@gmail.com.jpeg"
  // );

  // const directionnameplace = path.resolve(
  //   `./public/users/${req.user.email}.jpeg`
  // );

  // const directionnameplaceloc = path.resolve(
  //   `./public/users/devyehia@gmail.com.jpeg`
  // );

  // console.log(directionnameplaceloc);

  // const directionnameplace = path.resolve(`devyehia@gmail.com.jpeg`);

  // console.log(directionnameplace);

  //  fs.readFile(`/${req.user.email}.jpeg`, function (err, data) {
  // if (err)
  //   return res
  //     .status(200)
  //     .json({ message: "no image", direction: directionnameplace }); // Fail if the file can't be read.

  // const base64Image = Buffer.from(data, "binary").toString("base64");

  // res.status(200).json({ code: "there is a file" });

  // const directionnameplaceloc = path.resolve(process.cwd(), "public");

  // var path = require("path");
  const configDirectory = path.resolve(
    process.cwd(),
    "public/users",
    "devyehia@gmail.com.jpeg"
  );

  console.log(process.cwd());

  // res.status(200).json({ images: process.cwd() });

  fs.readFile(
    `${process.cwd()}/public/users/${req.user.email}.jpeg`,
    function (err, data) {
      //   "utf8"
      // );

      // fs.readFile(`${req.user.email}.jpeg`, function (err, data) {
      // fs.readFileSync(directionnameplaceloc, function (err, data) {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: err, loc: process.cwd() });
      } // Fail if the file can't be read.
      // {
      //   encoding: "base64",
      // },

      const base64Image = Buffer.from(data, "binary").toString("base64");

      const base64ImageStr = `data:image/${extensionName
        .split(".")
        .pop()};base64,${base64Image}`;

      // res.status(200).json({ images: base64ImageStr });
      // res.status(200).json({ images: base64ImageStr });

      res.setHeader("Content-Type", "multipart/form-data");

      res.status(200).json({ images: base64ImageStr });
    }
  );

  // // convert image file to base64-encoded string
  // const base64Image = Buffer.from(data, "binary").toString("base64");

  // const base64ImageStr = `data:image/${extensionName
  //   .split(".")
  //   .pop()};base64,${base64Image}`;

  // // console.log(base64ImageStr);

  // return base64ImageStr;
  // console.log(data);

  // fs.readFile(directionname, function (err, data) {
  // fs.readFile(directionnameplace, function (err, data) {
  //   // fs.readFile(`/${req.user.email}.jpeg`, function (err, data) {
  //   if (err)
  //     return res
  //       .status(200)
  //       .json({ message: "no image", direction: directionnameplace }); // Fail if the file can't be read.

  //   const base64Image = Buffer.from(data, "binary").toString("base64");

  //   const base64ImageStr = `data:image/${extensionName
  //     .split(".")
  //     .pop()};base64,${base64Image}`;

  // res.status(200).json({ images: base64ImageStr, direction: directionname });
  // });
};

// try {
//   fs.readFile(`public/users/${req.user.email}.jpeg`, function (err, data) {
//     if (err) return res.status(200).json({ message: "no image" }); // Fail if the file can't be read.

//     // http.createServer(function(req, res) {
//     //   res.writeHead(200, {'Content-Type': 'image/jpeg'})
//     //   res.end(data) // Send the file data to the browser.
//     // }).listen(8124)
//     // console.log('Server running at http://localhost:8124/')
//     // console.log(data);

//     // res.download(`public/users/${req.user.email}.jpeg`);

//     // res.status(200).json({ message: "Image Added Successfully" });

//     const extensionName = "jpeg";

//     // convert image file to base64-encoded string
//     const base64Image = Buffer.from(data, "binary").toString("base64");

//     // console.log(base64Image);

//     // combine all strings
//     const base64ImageStr = `data:image/${extensionName
//       .split(".")
//       .pop()};base64,${base64Image}`;

//     // console.log(base64Image);

//     // console.log(base64ImageStr);

//     return res.status(200).json({ image: base64ImageStr });

//     // res.status(200).json({ message: base64Image });

//     // res.download("public/image1.png");
//   });
// } catch (error) {
//   return res.status(200).json({ message: "error" });
// }

// res.status(200).json({ message: "ImageSend" });

// fs.readFile("image.jpg", function (err, data) {
//   if (err) throw err; // Fail if the file can't be read.
//   http
//     .createServer(function (req, res) {
//       res.writeHead(200, { "Content-Type": "image/jpeg" });
//       res.end(data); // Send the file data to the browser.
//     })
//     .listen(8124);
//   console.log("Server running at http://localhost:8124/");
// });

// res.status(200).json({ message: "Image Added Successfully" });

// Uploading Images to S3 bucket
const uploadingImagesToS3 = async (req, res, next) => {
  // to get the user email and full data
  // console.log(req.user.email);
  // console.log(res.locals.user);

  // console.log(req.file);

  // const path = `./../frontend/public/users/images/${req.user.email}.jpeg`;

  // await sharp(req.file.buffer)
  //   .resize(300, 300)
  //   .toFormat("jpeg")
  //   .jpeg({ quality: 90 })
  //   .toFile(path);

  // updating user image
  // const user = await User.findOneAndUpdate(
  //   { email: res.locals.user.email },
  //   { photo: req.file.originalname },
  //   {
  //     new: true,
  //   }
  // );
  // const image = fs.readFile("image1.png");

  fs.readFile("public/image1.png", function (err, data) {
    if (err) throw err; // Fail if the file can't be read.
    // http.createServer(function(req, res) {
    //   res.writeHead(200, {'Content-Type': 'image/jpeg'})
    //   res.end(data) // Send the file data to the browser.
    // }).listen(8124)
    // console.log('Server running at http://localhost:8124/')
    // console.log(data);

    // res.download("public/image1.png");

    res.status(200).json({ message: "Image Added Successfully" });

    const extensionName = "png";

    // convert image file to base64-encoded string
    const base64Image = Buffer.from(data, "binary").toString("base64");

    // combine all strings
    // const base64ImageStr = `data:image/${extensionName
    //   .split(".")
    //   .pop()};base64,${base64Image}`;

    // console.log(base64Image);

    // console.log(base64ImageStr);

    // res.status(200).json({ image: base64Image });

    // res.status(200).json({ message: base64Image });

    // res.download("public/image1.png");

    // res.status(200).json({ message: "Image Added Successfully" });
  });

  // console.log(image);

  // fs.readFile("image.jpg", function (err, data) {
  //   if (err) throw err; // Fail if the file can't be read.
  //   http
  //     .createServer(function (req, res) {
  //       res.writeHead(200, { "Content-Type": "image/jpeg" });
  //       res.end(data); // Send the file data to the browser.
  //     })
  //     .listen(8124);
  //   console.log("Server running at http://localhost:8124/");
  // });

  // res.status(200).json({ message: "Image Added Successfully" });
};

////////////
// const updateImage_post = async (req, res) => {
//   // console.log(req.user);
//   //  console.log(res.locals.user.email);

//   const { image, email } = req.body.submission;

//   console.log(req.body.submission);

//   console.log(email);
//   console.log(image);

//   // console.log(name, address);

//   // const user = await User.findOneAndUpdate(
//   //   { email: res.locals.user.email },
//   //   {
//   //     new: true,
//   //   }
//   // );

//   // console.log(user);

//   // return res.status(404).json({ error: "No such user" });

//   // const user = await User.findOneAndUpdate({ _id: id }, { ...req.body });

//   // if (!user) {
//   //   return res.status(400).json({ error: "No such user" });
//   // }

//   // res.status(200).json({ user: res.locals.user, message: { user } });
//   res.status(200).json({ user: res.locals.user });
// };

// send a user contact
const saveContact_post = async (req, res) => {
  const { email, contact } = req.body.submission; // from the req.body sent from the frontend

  // console.log(req.body.submission);

  // name
  // here we are using de-structing assigning name and email and password to , from the request body we got.

  // let emptyFields = [];

  // if (!email) {
  //   emptyFields.push("email");
  // }
  // if (!contact) {
  //   emptyFields.push("contact");
  // }

  // if (emptyFields > 0) {
  //   return res
  //     .status(400)
  //     .json({ error: "please fill in all the fields", emptyFields });
  // }

  try {
    // console.log("here");

    const contactv = await Contact.create({ email, contact });

    // console.log(contactv);

    // jwt cookie send
    // const token = createToken(user._id);
    // res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 }); // this maxAge is in milisecond while jwt is in seconds maxage

    // sending a cookie response ..
    // res.cookie("Hi", true);

    // after we send a jwt token for the browser-frontend
    res.status(200).json({ message: "contact created" });
  } catch (error) {
    res.status(400).json({ error: "error" });
  }

  // const users = await User.find({}).sort({});

  // a normal cookie send
  // res.cookie("JWT-Test", false, { maxAge: 1000 * 60 * 60 * 24 }); - // setting the age for it to stay even if the browser was closed
  // 1000 milisecond * 60 sec * 60 minute * 24 hour

  // res.status(200).json(users); // res.status 200 means ok
};

// get user name and address data

const getNameData_post = async (req, res) => {
  const searcheduser = req.user.email;

  const getuser = await User.findOne({ email: searcheduser });

  if (!getuser) {
    return res.status(400).json({ error: "Error" });
  }

  // console.log(getuser);

  // a normal cookie send
  // res.cookie("JWT-Test", false, { maxAge: 1000 * 60 * 60 * 24 }); - // setting the age for it to stay even if the browser was closed
  // 1000 milisecond * 60 sec * 60 minute * 24 hour

  // res.status(200).json(users);

  // res.status(200).json({ user: getuser.name, email: getuser.email });
  res.status(200).json({
    name: getuser.name,
    address: getuser.address,
    email: getuser.email,
    mobile: getuser.mobilenumber,
    role: getuser.role,
  });
};

const changePassword_post = async (req, res) => {
  // const searcheduser = req.user.email;

  const { password, newpassword } = req.body.submission;

  // console.log(password, newpassword);

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res
      .status(401)
      .json({ error: "You are not logged in! Please log in to get access." });
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_Secret);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  // console.log(currentUser.password);

  if (currentUser) {
    const auth = await bcrypt.compare(password, currentUser.password);
    if (!auth) {
      return res.status(400).json({ error: "incorrect password" });
    }
  }

  // console.log("old password right");

  // hashing the new password to save it

  const salt = await bcrypt.genSalt();
  const newPasswordHashed = await bcrypt.hash(newpassword, salt);

  // console.log(newPasswordHashed);

  // const user = await User.findOneAndUpdate(
  //
  //   { photo: req.file.originalname },
  //   {
  //     new: true,
  //   }
  // );

  const newUserPassword = await User.findOneAndUpdate(
    { email: currentUser.email },
    { password: newPasswordHashed },
    {
      new: true,
    }
  );

  if (!newUserPassword) {
    return res.status(400).json({ error: "Error" });
  }

  // console.log(newUserPassword);

  // console.log("all good and new password is set");

  // return res.status(200).json({ meesage: "u are in all good" });
  // GRANT ACCESS TO PROTECTED ROUTE
  // req.user = currentUser;
  // res.locals.user = currentUser;

  // console.log(res.locals.user);

  // const searcheduser = req.user.email;

  // const getuser = await User.findOne({ email: searcheduser });

  // console.log(getuser);

  // a normal cookie send
  // res.cookie("JWT-Test", false, { maxAge: 1000 * 60 * 60 * 24 }); - // setting the age for it to stay even if the browser was closed
  // 1000 milisecond * 60 sec * 60 minute * 24 hour

  // res.status(200).json(users);

  // res.status(200).json({ user: getuser.name, email: getuser.email });
  res.status(200).json({
    message: "password changed successfully",
  });
};

// ///////////////////////////////////////////

// For Emails

// Forgot password Email Function - Reset

const resetpasswordemail_post = async (req, res, next) => {
  // console.log(req.body.submission);

  const getuser = await User.findOne({ email: req.body.submission.email });

  if (!getuser) {
    return res.status(401).json({ error: "Email is not registered" });
  }

  // console.log(getuser);

  const token = createToken(getuser._id);

  // console.log(token);

  // res.status(200).json({ user: getuser, token });

  // res.status(401).json({ error: "Email is not registered" });

  // console.log(getuser.email);

  // res.status(200).json("email sent");

  // next();

  const data = {
    from: "Excited User <me@samples.mailgun.org>",
    to: `${getuser.email}`,
    subject: "Reset Password Email",
    text: "Hello, please open this link to reset your password, (note if the link didn't work that might be because the email was added to the spam, you can copy the link and paste it, or mark the email as not spam to be able to open the link normally)",
    html: `<a href="https://sprightly-queijadas-dc931f.netlify.app/resetpassword/${token}">https://sprightly-queijadas-dc931f.netlify.app/resetpassword/${token}</a>
     <br>Please open this link to reset your password<br>
     <br>Click on the link to open it or copy it to the browser to open it<br>
     <br><br> <br>(note if the link didn't work that might be because the email was added to the spam, you can copy the link and paste it, or mark the email as not spam to be able to open the link normally)<br>`,
  };

  mailgun.messages().send(data, function (error, body) {
    // console.log(body);
    res.status(200).json("email sent");
  });
};

// Send Email after successful order placed Email Function

const orderConfirmedemail_post = async (req, res, next) => {
  // console.log(req.body.submission);

  // orderNumber is sent from the frontend based on another call
  const userOrderNumber = req.body.submission.ordernumber;

  // console.log(userOrderNumber);

  // getting the order full info

  const findOrder = await Order.findOne({ ordernumber: userOrderNumber });

  if (!findOrder) {
    return res.status(400).json({ error: "error" });
  }

  // console.log(findOrder);

  // console.log(findOrder.user);

  if (findOrder.mailSent === false) {
    const updatedOrder = await Order.findOneAndUpdate(
      { ordernumber: userOrderNumber },
      { mailSent: true },
      {
        new: true,
      }
    );

    // console.log(updatedOrder);
  }

  if (findOrder.mailSent === false) {
    // console.log("we will send for this one");

    const data = {
      from: "Excited User <me@samples.mailgun.org>",
      to: `${findOrder.user}`,
      subject: "TeaBrand, Order Placed Successfully",
      text: "Thank you, Your order was placed successfully and we will prepare your package right away",
      html: `<br>Thank you, Your order was placed successfully and we will prepare your package right away<br>
         <br>Order Number ${1000 + userOrderNumber}<br>
         <br><br>
         <br>If you want to check our other products please visit this link<br>
         <a href="https://sprightly-queijadas-dc931f.netlify.app/collections">https://sprightly-queijadas-dc931f.netlify.app/collections</a>
         <br><br>
         <br>And If you have any question or inquiry please don't hesitate to open the live chat on our website or contact us<br>
         `,
    };

    mailgun.messages().send(data, function (error, body) {
      // console.log(body);
      // res.status(200).json("email sent");
      res.status(200).json("sending email ...");
    });
  }

  if (findOrder.mailSent !== false) {
    res.status(200).json("already sent");
  }

  // will check if email sent for the order is true or false from the order boolean check email condition

  // const getUserorders = await Order.find({ email: req.body.submission.email });

  // console.log(getUserorders);
};

// reset password with token send from the email url
const ResetPasswordwToken_post = async (req, res) => {
  // const searcheduser = req.user.email;

  const { newpassword, token } = req.body.submission;

  // console.log(password, newpassword);

  if (!token) {
    return res
      .status(401)
      .json({ error: "Error please request another email" });
  }

  try {
    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_Secret);

    if (!decoded) {
      return res
        .status(400)
        .json({ error: "Error please request another email" });
    }
  } catch {
    return res
      .status(400)
      .json({ error: "Error please request another email" });
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_Secret);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  // console.log(currentUser.password);

  if (!currentUser) {
    return res
      .status(400)
      .json({ error: "Error please request another email" });
  }

  // console.log("old password right");

  // hashing the new password to save it

  const salt = await bcrypt.genSalt();
  const newPasswordHashed = await bcrypt.hash(newpassword, salt);

  // console.log(newPasswordHashed);

  // const user = await User.findOneAndUpdate(
  //
  //   { photo: req.file.originalname },
  //   {
  //     new: true,
  //   }
  // );

  const newUserPassword = await User.findOneAndUpdate(
    { email: currentUser.email },
    { password: newPasswordHashed },
    {
      new: true,
    }
  );

  if (!newUserPassword) {
    return res.status(400).json({ error: "Error" });
  }
  // console.log(newUserPassword);

  // console.log("all good and new password is set");

  // return res.status(200).json({ meesage: "u are in all good" });
  // GRANT ACCESS TO PROTECTED ROUTE
  // req.user = currentUser;
  // res.locals.user = currentUser;

  // console.log(res.locals.user);

  // const searcheduser = req.user.email;

  // const getuser = await User.findOne({ email: searcheduser });

  // console.log(getuser);

  // a normal cookie send
  // res.cookie("JWT-Test", false, { maxAge: 1000 * 60 * 60 * 24 }); - // setting the age for it to stay even if the browser was closed
  // 1000 milisecond * 60 sec * 60 minute * 24 hour

  // res.status(200).json(users);

  // res.status(200).json({ user: getuser.name, email: getuser.email });
  res.status(200).json({
    message: "password Reset was successful",
  });
};

/////////////////////////////////////////////////////

// for opening chat with user and starting chat
const openChat_post = async (req, res) => {
  // console.log(req.body.submission);

  //checking for if blocked user

  const getchatblocked = await Chat.findOne({
    client: req.body.submission.email,

    blocked: true,
  });

  // console.log(getchatblocked);

  if (getchatblocked) {
    return res.status(200).json({ message: "you are blocked" });
  }

  const getchat = await Chat.findOne({
    client: req.body.submission.email,
    opened: true,
  });

  // console.log(getchat);

  if (getchat) {
    // console.log("there is");

    res.status(200).json(getchat);
  }

  if (!getchat) {
    // console.log("there isn't");

    const openedChat = await Chat.create({
      client: req.body.submission.email,
    });

    res.status(200).json(openedChat);
  }

  // res.status(200).json({ message: "hello" });

  // const openedChat = await Chat.create({
  //   client: req.body.submission.email,
  // });

  // res.status(200).json(getchat);

  // res.status(200).json(openedChat);
};

// receiving messages chat
const receiveMessages_post = async (req, res) => {
  // console.log(req.body.submission);

  // console.log(req.body.submission.message);

  //checking for if blocked user

  const getchatblocked = await Chat.findOne({
    chatid: req.body.submission.chatid,

    blocked: true,
  });

  // console.log(getchatblocked);

  if (getchatblocked) {
    return res.status(200).json({ message: "you are blocked" });
  }

  // find the chat id message which is opened and updating that chat

  const getchat = await Chat.findOne({
    chatid: req.body.submission.chatid,
    opened: true,
  });

  if (getchat) {
    // console.log("there is");

    // console.log([...getchat.clientmails.messages, req.body.submission.message]);

    const newItem = await Chat.findOneAndUpdate(
      { chatid: req.body.submission.chatid, opened: true },
      {
        $set: {
          clientmails: {
            messages: [
              ...getchat.clientmails.messages,
              req.body.submission.message,
            ],
          },
        },
      },
      { new: true }
    );

    // console.log(newItem.clientmails.messages);

    res.status(200).json(newItem.clientmails.messages);
  }

  if (!getchat) {
    return res.status(400).json({ error: "Error" });
  }
};

// getting all messages

const getMessages_post = async (req, res) => {
  // console.log(req.body.submission);

  //checking for if blocked user

  const getchatblocked = await Chat.findOne({
    client: req.body.submission.email,

    blocked: true,
  });

  // console.log(getchatblocked);

  if (getchatblocked) {
    return res.status(200).json({ message: "you are blocked" });
  }

  const getchat = await Chat.findOne({
    client: req.body.submission.email,
    opened: true,
  });

  if (!getchat) {
    return res.status(400).json({ error: "Error" });
  }

  // const openedChat = await Chat.create({
  //   client: req.body.submission.email,
  // });

  res.status(200).json(getchat);
};

///////////////////////////////////////////////////////////////

//  for admin    //

// get all users
const getAllUsers_post = async (req, res, next) => {
  const users = await User.find({}).sort({});

  // a normal cookie send
  // res.cookie("JWT-Test", false, { maxAge: 1000 * 60 * 60 * 24 }); - // setting the age for it to stay even if the browser was closed
  // 1000 milisecond * 60 sec * 60 minute * 24 hour

  res.status(200).json(users); // res.status 200 means ok
};

// ADD A USER FROM ADMIN PANEL

const AddUserAdmin_post = async (req, res, next) => {
  const { id } = req.params;

  // so avoid  id } = req.params.id ?!

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such user" });
  }

  const user = await User.findOneAndDelete({ _id: id });

  if (!user) {
    return res.status(400).json({ error: "No such workout" });
  }

  res.status(200).json(user);
};

// update user info from admin panel

const updateUserInfo_post = async (req, res, next) => {
  // info send from admin panel
  // console.log(req.body);

  // selected user email
  // console.log(req.body.selectedUser);

  // updated data
  if (req.body.name) {
    try {
      const updateduserName = await User.findOneAndUpdate(
        { email: req.body.selectedUser },
        { name: req.body.name },
        {
          new: true,
        }
      );
    } catch (error) {
      res.status(400).json({ error: "Error updating name" });
    }
  }
  if (req.body.address) {
    try {
      const updateduseraddress = await User.findOneAndUpdate(
        { email: req.body.selectedUser },
        { address: req.body.address },
        {
          new: true,
        }
      );
    } catch (error) {
      res.status(400).json({ error: "Error updating address" });
    }
  }
  if (req.body.mobile) {
    try {
      const updatedusermobile = await User.findOneAndUpdate(
        { email: req.body.selectedUser },
        { mobilenumber: req.body.mobile },
        {
          new: true,
        }
      );
    } catch (error) {
      res.status(400).json({ error: "Error updating mobile number" });
    }
  }
  if (req.body.role) {
    try {
      const updateduserrole = await User.findOneAndUpdate(
        { email: req.body.selectedUser },
        { role: req.body.role },
        {
          new: true,
        }
      );
    } catch (error) {
      res.status(400).json({ error: "Error updating mobile number" });
    }
  }

  res.status(200).json({ message: "user updated" });
};

// DE-Activate User
const deactivateUser_post = async (req, res) => {
  // the item selected to be updated
  // the updated data

  // console.log(req.body.submission);

  // if (!user) {
  //   return res.status(400).json({ error: "Error" });
  // }

  const userSelected = await User.findOne({
    email: req.body.submission.Users.email,
    active: true,
  });

  if (userSelected) {
    const userSelectedDeactivitedAction = await User.findOneAndUpdate(
      { email: req.body.submission.Users.email },
      { active: false },
      {
        new: true,
      }
    );

    // console.log("Deactivited");
  }

  if (!userSelected) {
    const userSelectedDeactivitedAction = await User.findOneAndUpdate(
      { email: req.body.submission.Users.email },
      { active: true },
      {
        new: true,
      }
    );

    // console.log("Reversed Deactivite");
  }

  res.status(200).json({ message: "user deactivited or reversed " });
};

// Add new User

const addUserFromAdmin_post = async (req, res) => {
  // order selected to add note to
  // console.log(req.body.ordernumber);

  // console.log(req.body.submission);

  // console.log(req.body.submission.email);
  // console.log(req.body.submission.password);
  // console.log(req.body.submission.address);
  // console.log(req.body.submission.name);
  // console.log(req.body.submission.mobile);
  // console.log(req.body.submission.role);

  // note wanted to be added
  // console.log(req.body.note);

  // order state completed or not
  // console.log(req.body.order.opened);

  const checkIfUserExist = await User.findOne({
    email: req.body.submission.email,
  });
  if (checkIfUserExist) {
    res.status(400).json({ error: "there is an existing user" });
  }

  try {
    const user = await User.create({
      email: req.body.submission.email,
      password: req.body.submission.password,
      address: req.body.submission.address,
      name: req.body.submission.name,
      mobilenumber: req.body.submission.mobile,
      role: req.body.submission.role,
    });
    // jwt cookie send
    // const token = createToken(user._id);
    // res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 }); // this maxAge is in milisecond while jwt is in seconds maxage

    // sending a cookie response ..
    // res.cookie("Hi", true);

    // after we send a jwt token for the browser-frontend
    return res.status(200).json({ message: "New User Created" });
  } catch (error) {
    return res.status(400).json({ error: "Error Creating User" });
  }

  // Adding note the order
  // const user = await User.findOneAndUpdate(
  //   { email: req.body.email },
  //   { note: req.body.note },
  //   {
  //     new: true,
  //   }
  // );

  // console.log(user);

  // console.log(order);

  // console.log(order);

  // res.status(200).json({ message: "New User Created" });
};

// Add Note to User

const UserAddNote_post = async (req, res) => {
  // order selected to add note to
  // console.log(req.body.ordernumber);

  // console.log(req.body);

  // note wanted to be added
  // console.log(req.body.note);

  // order state completed or not
  // console.log(req.body.order.opened);

  // Adding note the order
  const user = await User.findOneAndUpdate(
    { email: req.body.email },
    { note: req.body.note },
    {
      new: true,
    }
  );

  if (!user) {
    return res.status(400).json({ error: "Error " });
  }

  // console.log(user);

  res.status(200).json({ message: "Note Add to User" });
};

// delete a user
const deleteUser_post = async (req, res, next) => {
  // user selected to delete email
  // console.log(req.body.submission.userSelected);

  try {
    const userDeleted = await User.findOneAndDelete({
      email: req.body.submission.userSelected,
    });

    return res.status(200).json({ message: "User Deleted succesfully" });
  } catch (error) {
    return res.status(400).json({ error: "Error deleting User" });
  }
};

// Admin Panel Active Chat, Get All Active Chat

const getAllActiveChat_post = async (req, res, next) => {
  // console.log(req.body);

  try {
    // trying to find all Active Chat
    const chats = await Chat.find({}).sort({});

    // sending All Active Chat to the admin panel
    return res.status(200).json({ chats });
  } catch (error) {
    return res.status(400).json({ error: "Error Fetching All Active Chat" });
  }
};

// Admin Panel Active Chat, Admin Sending Chat Messages

// const AdminSendingMessagesOnActiveChat_post = async (req, res, next) => {
//   console.log(req.body);

//   // try {
//   //   // trying to find all Active Chat
//   //   const chats = await Chat.find({}).sort({});

//   //   // sending All Active Chat to the admin panel
//   //   res.status(200).json({ chats });
//   // } catch (error) {
//   //   res.status(400).json({ error: "Error Fetching All Active Chat" });
//   // }

//   res.status(200).json({ Message: "Message Added" });
// };

// receiving messages chat
const AdminSendingMessagesOnActiveChat_post = async (req, res) => {
  // Message Send from admin
  // console.log(req.body.submission);

  // chat id
  // console.log(req.body.submission.chatid);

  // console.log(req.body.submission.message);

  // find the chat id message which is opened and updating that chat

  const getchat = await Chat.findOne({ chatid: req.body.submission.chatid });

  if (getchat) {
    // console.log("there is");

    // console.log([...getchat.adminmails.messages, req.body.submission.message]);

    const newItem = await Chat.findOneAndUpdate(
      { chatid: req.body.submission.chatid },
      {
        $set: {
          adminmails: {
            messages: [
              ...getchat.adminmails.messages,
              req.body.submission.message,
            ],
          },
        },
      },
      { new: true }
    );

    // console.log(newItem.clientmails.messages);

    // res.status(200).json(newItem.clientmails.messages);
    return res.status(200).json({ Message: "Message Added" });
  }

  if (!getchat) {
    return res.status(400).json({ error: "Error finding Chat" });
  }

  // res.status(200).json({ Message: "Message Added" });
};

// admin mark join chat
const adminjoinchat_post = async (req, res) => {
  // chat id
  // console.log(req.body.submission.chatid);

  // find chat

  // mark join true to show for the user..
  try {
    const newItem = await Chat.findOneAndUpdate(
      { chatid: req.body.submission.chatid },
      {
        joined: true,
      },
      { new: true }
    );

    // console.log(newItem);
    return res.status(200).json({ Message: "Joined Chat successfully" });
  } catch (error) {
    return res.status(400).json({ error: "Error Joining Chat" });
  }

  res.status(400).json({ error: "Error finding Chat " });
};

// admin mark chat completed
const adminmarkchatcomplete_post = async (req, res) => {
  // chat id
  // console.log(req.body.submission.chatid);

  // find chat

  // console.log(req.body.submission.state);

  // const getchat = await Chat.findOne({ chatid: req.body.submission.chatid });

  // mark join true to show for the user..
  try {
    const newItem = await Chat.findOneAndUpdate(
      { chatid: req.body.submission.chatid },
      {
        opened: req.body.submission.state,
      },
      { new: true }
    );

    // console.log(newItem);
    return res
      .status(200)
      .json({ Message: "Chat Marked Completed successfully" });
  } catch (error) {
    return res.status(400).json({ error: "Error Marking Chat" });
  }

  res.status(400).json({ error: "Error finding Chat " });
};

// ADD Note to Order

const adminaddnotetochat_post = async (req, res) => {
  // chat id
  // console.log(req.body.submission);

  // note and chat id
  // console.log(req.body.submission.note);
  // console.log(req.body.submission.chatid);

  // find chat

  // Adding note the chat
  try {
    const newItem = await Chat.findOneAndUpdate(
      { chatid: req.body.submission.chatid },
      {
        note: req.body.submission.note,
      },
      { new: true }
    );

    // console.log(newItem);
    return res.status(200).json({ Message: "Note Added successfully" });
  } catch (error) {
    return res.status(400).json({ error: "Error Addign Note" });
  }

  res.status(400).json({ error: "Error finding Chat " });
};

// mark the chat for the manger to check later
const adminmarkformanger_post = async (req, res) => {
  // chat id
  // console.log(req.body.submission.chatid);

  // find chat

  // mark the chat for the manger to check later
  try {
    const newItem = await Chat.findOneAndUpdate(
      { chatid: req.body.submission.chatid },
      {
        markedformanger: true,
      },
      { new: true }
    );

    // console.log(newItem);
    return res
      .status(200)
      .json({ Message: "Chat Marked for Manger successfully" });
  } catch (error) {
    return res.status(400).json({ error: "Error Marking for manger Chat" });
  }

  res.status(400).json({ error: "Error finding Chat " });
};

// block user email in the chat
const adminblockuseremail_post = async (req, res) => {
  // chat id
  // console.log(req.body.submission.chatid);

  // find chat

  // console.log(req.body.submission.state);

  // block user email
  try {
    const newItem = await Chat.findOneAndUpdate(
      { chatid: req.body.submission.chatid },
      {
        blocked: req.body.submission.state,
      },
      { new: true }
    );

    // console.log(newItem);
    return res.status(200).json({ Message: "Chat blocked" });
  } catch (error) {
    return res.status(400).json({ error: "Error blocking chat " });
  }

  res.status(400).json({ error: "Error finding Chat " });
};

// get all users
const dashboardData_post = async (req, res, next) => {
  const users = (await User.find({}).sort({})).length;
  const orders = (await Order.find({}).sort({})).length;
  const chats = (await Chat.find({}).sort({})).length;
  const products = (await Item.find({}).sort({})).length;

  // console.log(users);
  // console.log(orders);
  // console.log(chats);
  // console.log(products);

  // const dashboardNumbers =

  // a normal cookie send
  // res.cookie("JWT-Test", false, { maxAge: 1000 * 60 * 60 * 24 }); - // setting the age for it to stay even if the browser was closed
  // 1000 milisecond * 60 sec * 60 minute * 24 hour

  res
    .status(200)
    .json({ users: users, orders: orders, chats: chats, products: products }); // res.status 200 means ok
};

module.exports = {
  createUser_post,
  loginUser_post,
  profileDataGet_post,
  logoutUser_post,
  updateUser_post,
  deleteUser_post,
  getAllUsers_post,
  AddUserAdmin_post,
  imageUserAddUpdate,
  saveContact_post,
  getNameData_post,
  changePassword_post,
  resetpasswordemail_post,
  openChat_post,
  receiveMessages_post,
  getMessages_post,
  ResetPasswordwToken_post,
  orderConfirmedemail_post,
  ImageProfileSendBackToFe,
  deactivateUser_post,
  UserAddNote_post,
  addUserFromAdmin_post,
  updateUserInfo_post,
  getAllActiveChat_post,
  AdminSendingMessagesOnActiveChat_post,
  adminjoinchat_post,
  adminmarkchatcomplete_post,
  adminaddnotetochat_post,
  adminmarkformanger_post,
  adminblockuseremail_post,
  dashboardData_post,
};
