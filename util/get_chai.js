

async function get_chai() {
    const { default: chai } = await import('chai'); 
    const { default: chaiHttp } = await import('chai-http'); 
  
    chai.use(chaiHttp);
  
    const expect = chai.expect;
    const request = chai.request;
  
    return { chai, expect, request };
  }
  
  module.exports = get_chai;