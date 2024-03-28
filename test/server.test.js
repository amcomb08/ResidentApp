const request = require('supertest');
const { app, db } = require('../server.js'); // Make sure to provide the correct path to your Express app

describe('Server Tests', function() {
  let server;

  before(function(done) {
      // Start server on a random free port
      server = app.listen(0, done);
  });

  after(function(done) {
    server.close(() => {
      db.end(() => {
        console.log('Server and DB pool closed');
        done();
      });
    });
    process.exit();
  });

  it('Should respond from Node.js server', function(done) {
      request(`http://localhost:${server.address().port}`)
          .get('/')
          .expect(200)
          .end(done);
  });

});