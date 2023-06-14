const Item = require("../models/itemModel");
const mongoose = require("mongoose");

const sharp = require("sharp");
const AWS = require("aws-sdk");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const fileUpload = require("express-fileupload");
const { S3Client } = require("@aws-sdk/client-s3");
const axios = require("axios");

// get all items

const getItems = async (req, res) => {
  const items = await Item.find({}).sort({});

  res.status(200).json(items); // res.status 200 means ok
};

// get a single item

const getItem = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such item" });
  }

  const item = await Item.findById(id);

  if (!item) {
    return res.status(404).json({ error: "No such item" });
  }

  res.status(200).json(item);
};

// ADDING new ITEM IMAGE TO the cloud S3
const createNewItem_post = async (req, res) => {
  // ITEM Data
  // console.log(req.body);

  // const itemName = req.files.photo.name.split(".")[0];

  // const itemName = "Black tea";

  // Assiging the Name and Price
  const productname = req.body.name;
  const productprice = req.body.price;

  // checking if there is an item with the same name
  const duplicateItem = await Item.findOne({ name: productname });

  if (duplicateItem) {
    return res
      .status(400)
      .json({ error: "item with the same name already exists" });
  }

  // adding the Product Image to the S3 Bucket
  // console.log(req.files);

  const semiTransparentRedPng = await sharp(req.files.photo.data)
    .resize(600, 600)
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
    Bucket: "next-ecommerce-s3/items",
    // Key: req.files.photo.name,
    Key: `${productname}.png`,
    Body: fileContent,
    ACL: "public-read",
  };

  s3.upload(params, (err, data) => {
    if (err) {
      throw err;
    }
    // res.send({ data: data });
  });

  // // const { name, price } = req.body.submission;

  // // // full file name senf from frontend
  // console.log(req.submission);

  // // // file name senf from frontend
  // console.log(req.files.photo.data);

  // // file name senf from frontend
  // console.log(req.files.photo.name);

  // console.log("Image uploaded");
  // console.log(req.body.submission);
  // const { name, price, image } = req.body;
  // here we are using de-structing assigning name and email and password to , from the request body we got.
  // let emptyFields = [];
  // if (!name) {
  //   emptyFields.push("name");
  // }
  // if (!price) {
  //   emptyFields.push("email");
  // }
  // if (!image) {
  //   emptyFields.push("password");
  // }
  // if (emptyFields > 0) {
  //   return res
  //     .status(400)
  //     .json({ error: "please send all the needs components", emptyFields });
  // }
  try {
    const item = await Item.create({
      name: productname,
      price: productprice,
      type: req.body.type ? req.body.type : "",
    });
    res.status(200).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
  //   res.status(400).json({ error: error.message });

  // res.status(200).json({ message: "done" });
};

// delete a item

const deleteItem_post = async (req, res) => {
  // const { id } = req.params;

  // console.log("hey");

  const name = req.body.submission.name;

  // console.log(name);

  // so avoid  id } = req.params.id ?!

  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "No such item" });
  // }

  const item = await Item.findOneAndDelete({ name: name });

  if (!item) {
    return res.status(400).json({ error: "Error, No such item found" });
  }

  res.status(200).json({ message: "Item Deleted" });
};

// update a item

const updateItem_post = async (req, res) => {
  // const { id } = req.params;

  // ITEM SELECTED
  const selectedItem = req.body.selectedItem;

  // ITEM Data
  // console.log(req.body);

  // console.log(req.files);

  // const itemName = req.files.photo.name.split(".")[0];

  // const itemName = "Black tea";

  if (req.body.price) {
    // console.log("there is price");

    const productprice = req.body.price;

    try {
      const newUserPassword = await Item.findOneAndUpdate(
        { name: selectedItem },
        { price: productprice },
        {
          new: true,
        }
      );
    } catch (error) {
      res.status(400).json({ error: "Error updating price" });
    }
  }

  if (req.body.type) {
    // console.log("there is price");

    const producttype = req.body.type;

    try {
      const newUserPassword = await Item.findOneAndUpdate(
        { name: selectedItem },
        { type: producttype },
        {
          new: true,
        }
      );
    } catch (error) {
      res.status(400).json({ error: "Error updating type" });
    }
  }

  if (req.body.name) {
    // console.log("there is name");

    const productname = req.body.name;

    try {
      const newUserPassword = await Item.findOneAndUpdate(
        { name: selectedItem },
        { name: productname },
        {
          new: true,
        }
      );
    } catch (error) {
      res.status(400).json({ error: "Error, same product name already exist" });
    }
  }

  // Assiging the Name and Price
  // const productname = req.body.name;

  // checking if there is an item with the same name
  // const duplicateItem = await Item.findOne({ name: productname });

  // if (duplicateItem) {
  //   return res
  //     .status(400)
  //     .json({ error: "item with the same name already exists" });
  // }

  // adding the Product Image to the S3 Bucket

  if (req.body.name && !req.files) {
    // console.log(
    //   "there is no photo but there is name change, effecting image fetching so.."
    // );

    // const selectedItemUrl = "";

    const response = await axios.get(req.body.selectedItemUrl, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "utf-8");

    const productNameCheckv2 = req.body.name;

    // console.log(productNameCheckv2);

    const semiTransparentRedPng = await sharp(buffer)
      .resize(600, 600)
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
      Bucket: "next-ecommerce-s3/items",
      // Key: req.files.photo.name,
      Key: `${productNameCheckv2}.png`,
      Body: fileContent,
      ACL: "public-read",
    };

    s3.upload(params, (err, data) => {
      if (err) {
        throw err;
      }
      // res.send({ data: data });
    });

    // console.log("same Image uploaded");
  }

  if (req.files) {
    // console.log(selectedItem);
    // console.log("there is photo");

    // const productNameCheck = selectedItem;

    // console.log(selectedItem);

    // console.log(productNameCheck);

    // console.log(req.files.photo.data);

    const semiTransparentRedPng = await sharp(req.files.photo.data)
      .resize(600, 600)
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
      Bucket: "next-ecommerce-s3/items",
      // Key: req.files.photo.name,
      Key: `${selectedItem}.png`,
      Body: fileContent,
      ACL: "public-read",
    };

    s3.upload(params, (err, data) => {
      if (err) {
        // console.log(err);
        throw err;
      }

      // console.log(data);
    });

    // console.log("Image uploaded");
  }

  res.status(200).json({ message: "was updated" });

  // // const { name, price } = req.body.submission;

  // // // full file name senf from frontend
  // console.log(req.submission);

  // // // file name senf from frontend
  // console.log(req.files.photo.data);

  // // file name senf from frontend
  // console.log(req.files.photo.name);

  // console.log(req.body.submission);
  // const { name, price, image } = req.body;
  // here we are using de-structing assigning name and email and password to , from the request body we got.
  // let emptyFields = [];
  // if (!name) {
  //   emptyFields.push("name");
  // }
  // if (!price) {
  //   emptyFields.push("email");
  // }
  // if (!image) {
  //   emptyFields.push("password");
  // }
  // if (emptyFields > 0) {
  //   return res
  //     .status(400)
  //     .json({ error: "please send all the needs components", emptyFields });
  // }

  // try {
  //   const item = await Item.create({ name: productname, price: productprice });
  //   res.status(200).json(item);
  // } catch (error) {
  //   res.status(400).json({ error: error.message });
  // }
  //   res.status(400).json({ error: error.message });
};

module.exports = {
  getItem,
  getItems,
  createNewItem_post,
  deleteItem_post,
  updateItem_post,
};
