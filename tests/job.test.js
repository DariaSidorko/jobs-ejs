
const get_chai = require("../util/get_chai");
const app = require("../app"); 


describe('Job API Tests', function() {
  it('should GET all jobs', async function() {
    const { expect, request } = await get_chai();
    
    const res = await request(app).get('/jobs');
    
    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
  });

  it('should POST a new job', async function() {
    const { expect, request } = await get_chai();

    const jobData = {
      company: 'New Company',
      position: 'New Position',
      status: 'pending',
    };

    const res = await request(app).post('/jobs').send(jobData);
    
    expect(res).to.have.status(201);
    expect(res.body).to.have.property('company', 'New Company');
  });

});