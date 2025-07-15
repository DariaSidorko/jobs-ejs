

const { build, perBuild, fake } = require('test-data-bot');
const mongoose = require("mongoose");
const faker = require("@faker-js/faker").fakerEN_US;
const User = require("../models/User");
const Job = require("../models/Job");
require("dotenv").config();

const testUserPassword = faker.internet.password();

const userBuilder = build('User').fields({
  name: fake(f => f.person.fullName()),
  email: fake(f => f.internet.email()),
  password: perBuild(() => testUserPassword),
});

const jobBuilder = build('Job').fields({
  company: fake(f => f.company.name()),
  position: fake(f => f.person.jobTitle()),
  status: perBuild(() => {
    const statuses = ["interview", "declined", "pending"];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }),
  createdBy: null, // to be set later
});

const seed_db = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_TEST);
    await Job.deleteMany({});
    await User.deleteMany({});

    const user = await User.create(userBuilder());
    const jobs = [];

    for (let i = 0; i < 20; i++) {
      const jobData = jobBuilder({ createdBy: user._id });
      jobs.push(jobData);
    }

    await Job.insertMany(jobs);
    return user;
  } catch (err) {
    console.error("Error seeding DB:", err.message);
    throw err;
  }
};

module.exports = { seed_db, testUserPassword };

// const Job = require("../models/Job");
// const User = require("../models/User");
// const faker = require("@faker-js/faker").fakerEN_US;
// const FactoryBot = require("factory-bot");
// require("dotenv").config();

// const testUserPassword = faker.internet.password();
// const factory = FactoryBot.factory;
// const factoryAdapter = new FactoryBot.MongooseAdapter();
// factory.setAdapter(factoryAdapter);

// factory.define("job", Job, {
//     company: () => faker.company.name(),
//     position: () => faker.person.jobTitle(),
//     status: () =>
//         ["interview", "declined", "pending"][Math.floor(3 * Math.random())], // random status
// });

// factory.define("user", User, {
//     name: () => faker.person.fullName(),
//     email: () => faker.internet.email(),
//     password: () => faker.internet.password(),
// });

// const seed_db = async () => {
//     let testUser = null;
//     try {
//         const mongoURL = process.env.MONGO_URI_TEST;
//         await Job.deleteMany({}); // Deletes all job records
//         await User.deleteMany({}); // Deletes all user records
//         testUser = await factory.create("user", { password: testUserPassword });
//         await factory.createMany("job", 20, { createdBy: testUser._id }); // Create 20 job entries
//     } catch (e) {
//         console.log("Database error");
//         console.log(e.message);
//         throw e;
//     }
//     return testUser;
// };

// module.exports = { testUserPassword, factory, seed_db };