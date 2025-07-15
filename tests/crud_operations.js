
const { app } = require("../app");
const { factory, seed_db, testUserPassword } = require("../util/seed_db");
const get_chai = require("../util/get_chai");
const http = require("http");
const Job = require("../models/Job");

describe("tests for job CRUD operations", function () {
  let server;
  let csrfToken;
  let csrfCookie;
  let sessionCookie;
  let test_user;

  // Step 1 and 2: Seeding the database and logging in
  before(async function () {
    server = http.createServer(app).listen(5000);

    // Seed the database
    const { expect, request } = await get_chai();
    test_user = await seed_db(); 

    // Step 2: Get CSRF token and cookies from the logon page
    let req = request(app).get("/session/logon").send();
    let res = await req;

    const textNoLineEnd = res.text.replaceAll("\n", "");
    csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];
    let cookies = res.headers["set-cookie"];
    csrfCookie = cookies.find((element) => element.startsWith("csrfToken"));

    // Step 3: Log in using seeded user's credentials
    const dataToPost = {
      email: test_user.email,
      password: testUserPassword,
      _csrf: csrfToken,
    };

    req = request(app)
      .post("/session/logon")
      .set("Cookie", csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);
    res = await req;

    cookies = res.headers["set-cookie"];
    sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid")
    );

    expect(csrfToken).to.not.be.undefined;
    expect(sessionCookie).to.not.be.undefined;
    expect(csrfCookie).to.not.be.undefined;
  });

  after((done) => {
    server.close(done); // Close the server after tests
  });

  // Step 4: Get the job list
  it("should get the list of jobs", async () => {
    const { request, expect } = await get_chai();
    const res = await request(app)
      .get("/jobs") 
      .set("Cookie", sessionCookie)
      .send();
    
    expect(res).to.have.status(200);
    
    // Checking how many job entries are returned (20 seeded entries + 1 header row)
    const pageParts = res.text.split("<tr>");
    expect(pageParts.length).to.equal(21); // 1 for the header row + 20 job entries
  });

  // Step 5: Add a job entry
  it("should add a new job", async () => {
    const { request, expect } = await get_chai();
    
    const newJob = await factory.build("job", {
      title: "New Software Engineer Job",
      description: "This is a new job entry.",
      location: "Remote",
    });

    const dataToPost = {
      title: newJob.title,
      description: newJob.description,
      location: newJob.location,
      _csrf: csrfToken,
    };

    const res = await request(app)
      .post("/jobs")
      .set("Cookie", sessionCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);

    expect(res).to.have.status(201); // Ensure the job was created successfully

    // Verify that the database has 21 entries (20 from seed + 1 new job)
    const jobs = await Job.find({ createdBy: test_user._id });
    expect(jobs.length).to.equal(21);
  });

});