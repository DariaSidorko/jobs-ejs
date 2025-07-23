let chai_obj = null;

const get_chai = async () => {
  if (!chai_obj) {
    const { expect, use } = await import("chai");
    const chaiHttp = await import("chai-http");
    const chai = use(chaiHttp.default);
    chai_obj = { expect, request: chai.request };
  }
  return chai_obj;
};

module.exports = get_chai;


// async function get_chai() {
//     const { default: chai } = await import('chai'); 
//     const { default: chaiHttp } = await import('chai-http'); 
  
//     chai.use(chaiHttp);
  
//     const expect = chai.expect;
//     const request = chai.request;
  
//     return { chai, expect, request };
//   }
  
//   module.exports = get_chai;