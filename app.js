

const express = require("express");
require("express-async-errors");
require("dotenv").config();

const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const csrf = require("csurf");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const flash = require("connect-flash");

const jobsRouter = require("./routes/jobs");
const secretWordRouter = require("./routes/secretWord");
const sessionRoutes = require("./routes/sessionRoutes");
const auth = require("./middleware/auth");
const passportInit = require("./passport/passportInit");

const app = express();

// View engine
app.set("view engine", "ejs");

// Security middleware
app.use(helmet());
app.use(xss());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Cookie and Body parsers (must be before csrf)
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "mySessions",
});
store.on("error", console.log);

app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set to true if using HTTPS
  }));

// Passport
passportInit();
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Custom locals middleware
app.use(require("./middleware/storeLocals"));

// CSRF protection (must be after cookie/body parsers & session)
app.use(csrf({ cookie: true }));

// Set CSRF token in all views
app.use((req, res, next) => {
  res.locals._csrf = req.csrfToken();
  next();
});

// Routes
app.get("/", (req, res) => res.render("index"));
app.use("/sessions", sessionRoutes);
app.use("/secretWord", auth, secretWordRouter);
app.use("/jobs", auth, jobsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

// Error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send(err.message);
});


// Set Content-Type based on route
app.use((req, res, next) => {
    if (req.path === "/multiply") {
        res.set("Content-Type", "application/json");
    } else {
        res.set("Content-Type", "text/html");
    }
    next();
});

// Determine the correct MongoDB URI based on the environment
let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV === "test") {
    mongoURL = process.env.MONGO_URI_TEST;  // Use test database URI
}

const sessionParms = {
    secret: mongoURL,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: { secure: false, sameSite: "strict" },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionParms.cookie.secure = true;
  }
  
  app.use(session(sessionParms));

// Start server
const port = process.env.PORT || 3000;
const start = async () => {
  try {
    await require("./db/connect")(mongoURL);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();


