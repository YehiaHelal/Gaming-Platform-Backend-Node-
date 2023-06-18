require("dotenv").config();

//main
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

const mailgun = require("mailgun-js")({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
});

//security and other ulti-s
// const helmet = require("helmet");
// const rateLimit = require("express-rate-limit");
// const mongoSanitize = require("express-mongo-sanitize");
// const xss = require("xss-clean");
const compression = require("compression");
// const hpp = require("hpp");

// routes
const itemsRoutes = require("./routes/itemsRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userController = require("./controllers/userController");

// express app //
const app = express();

// middleware //
// app.use(express.json({ limit: "200kb" }));
// app.use(express.urlencoded({ extended: true, limit: "200kb" }));

app.use(express.json());
app.use(express.urlencoded());

app.use((req, res, next) => {
  // console.log(req.path, req.method);
  next();
});

app.use(cookieParser()); // To parse the incoming cookies
app.use(
  cors({
    credentials: true,
    origin: "https://gamingplatformtesting.netlify.app",
  })
);

// app.use(cors());
app.use(fileUpload());

///////////////////////////////////////
// security  //
// http: app.use(helmet());

// Limit requests from same API
// const limiter = rateLimit({
//   max: 10000,
//   windowMs: 60 * 60 * 1000,
//   message: "Too many requests from this IP, please try again in an hour!",
// });
// app.use("/api", limiter);

// Data sanitization against NoSQL query injection
// app.use(mongoSanitize());

// Data sanitization against XSS
// app.use(xss());

// Prevent parameter pollution
// app.use(
//   hpp({
//     whitelist: [
//       "duration",
//       "ratingsQuantity",
//       "ratingsAverage",
//       "maxGroupSize",
//       "difficulty",
//       "price",
//     ],
//   })
// );

app.use(compression());

// npm i helmet
///////////////////////////////////////

// routes  //
app.use("/api/users", authRoutes); // for users
app.use("/api/items", itemsRoutes); // for items
app.use("/api/orders", orderRoutes); // for orders
app.use("/api/mail", authRoutes); // for mails

// connect to db
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("connected to database");
    // listen to port
    app.listen(process.env.PORT, () => {
      console.log("listening for requests on port", process.env.PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });
``;
