origin-os-api/
  src/
    server.js
    db.js
    models/User.js
    middleware/auth.js
    routes/auth.routes.js
    utils/jwt.js
    utils/cookies.js
  .env
  package.json

mkdir origin-os-api
cd origin-os-api
npm init -y
npm i express mongoose bcrypt jsonwebtoken cookie-parser cors dotenv
npm i -D nodemon
