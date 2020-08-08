var createError = require("http-errors");
var express = require("express");
var logger = require("morgan");
const config = require("config");
const secret = config.get("session.secret");
const mongoose = require("mongoose");
const cors = require("cors");

const jwtMiddleware = require("express-jwt")({
  algorithms: ["HS256"],
  secret: config.get("session.secret"),
});
const jwt = require("jsonwebtoken");
const User = require("./user.model");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(cors());

mongoose.connect(config.get("mongo.url"));

app.post("/signup", async ({ body: user }, res) => {
  try {
    const usr = new User(user);
    console.log("user ::: ", usr);
    await usr.save();
    console.log("user again ::: ", usr);
    res.json({
      token: jwt.sign({ id: usr.id, email: usr.email }, secret, {
        expiresIn: "7d",
      }),
    });
  } catch (error) {
    console.log("err ::: ", error);
    res.status(500).send({ status: 500, message: "Something Went Wrong" });
  }
});

const unAuthorized = (res) => {
  res.status(401).json({ status: 401, message: "You are not authorized" });
};

app.post("/login", async ({ body: { email, password } }, res) => {
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return unAuthorized(res);
    } else {
      if (user.password === password) {
        res.json({
          token: jwt.sign({ id: user.id, email: user.email }, secret, {
            expiresIn: "7d",
          }),
        });
      } else {
        return unAuthorized(res);
      }
    }
  } catch (error) {
    console.log("err ::: ", error);
    res.status(500).json({ status: 500, message: "Something Went Wrong" });
  }
});

app.get("/current_user", jwtMiddleware, async ({ user: { id } }, res) => {
  try {
    const user = await User.findById(id).select("-password");
    res.json(user);
  } catch (error) {
    console.log("err ::: ", error);
    res.status(500).send({ status: 500, message: "Something Went Wrong" });
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  if (err.status === 401) {
    res.status(401).json(err);
    return;
  }

  if (err.status === 404) {
    res.status(404).json(err);
    return;
  }

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
