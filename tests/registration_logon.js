
const { app } = require("../app");
const { factory } = require("../util/seed_db");
const faker = require("@faker-js/faker").fakerEN_US;
const get_chai = require("../util/get_chai");

const User = require("../models/User");

describe("tests for registration and logon", function () {


  it("should get the registration page", async () => {
    const { expect, request } = await get_chai();

    const res = await request(app).get("/session/register").send();
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Enter your name");

    // Extract CSRF token
    const textNoLineEnd = res.text.replaceAll("\n", "");
    const csrfTokenMatch = /_csrf" value="(.*?)"/.exec(textNoLineEnd);
    expect(csrfTokenMatch).to.not.be.null;
    this.csrfToken = csrfTokenMatch[1];

    // Extract CSRF cookie
    const cookies = res.headers["set-cookie"];
    this.csrfCookie = cookies.find((element) =>
      element.startsWith("csrfToken")
    );
    expect(this.csrfCookie).to.not.be.undefined;
  });

  it("should register the user", async () => {
    const { expect, request } = await get_chai();

    this.password = faker.internet.password();
    this.user = await factory.build("user", { password: this.password });

    const dataToPost = {
      name: this.user.name,
      email: this.user.email,
      password: this.password,
      password1: this.password,
      _csrf: this.csrfToken,
    };

    const res = await request(app)
      .post("/session/register")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);

    expect(res).to.have.status(200);
    expect(res.text).to.include("Jobs List");

    const newUser = await User.findOne({ email: this.user.email });
    expect(newUser).to.not.be.null;
  });

  it("should log the user on", async () => {
    const { expect, request } = await get_chai();

    // Get fresh CSRF token and cookie
    const resGet = await request(app).get("/session/logon");
    const textNoLineEnd = resGet.text.replaceAll("\n", "");
    const csrfTokenMatch = /_csrf" value="(.*?)"/.exec(textNoLineEnd);
    this.csrfToken = csrfTokenMatch[1];
    this.csrfCookie = resGet.headers["set-cookie"].find((c) =>
      c.startsWith("csrfToken")
    );

    const dataToPost = {
      email: this.user.email,
      password: this.password,
      _csrf: this.csrfToken,
    };

    const res = await request(app)
      .post("/session/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);

    expect(res).to.have.status(302);
    expect(res.headers.location).to.equal("/");

    this.sessionCookie = res.headers["set-cookie"].find((c) =>
      c.startsWith("connect.sid")
    );
    expect(this.sessionCookie).to.not.be.undefined;
  });

  it("should get the index page", async () => {
    const { expect, request } = await get_chai();

    const res = await request(app)
      .get("/")
      .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`)
      .send();

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include(this.user.name);
  });

  it("should log the user off", async () => {
    const { expect, request } = await get_chai();

    const dataToPost = {
      _csrf: this.csrfToken,
    };

    const res = await request(app)
      .post("/session/logoff")
      .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);

    expect(res).to.have.status(200);
    expect(res.text).to.include("link to logon");
  });
});
