const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.status(401).json({ error: "Missing access token" });

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Attach user info for routes
    req.user = { sub: decoded.sub, email: decoded.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid access token" });
  }
}

module.exports = { requireAuth };

// OLD VERSION
// const { verifyAccess } = require("../Utils/jwt");

// function requireAuth(req, res, next) {
//   const header = req.headers.authorization || "";
//   const token = header.startsWith("Bearer ") ? header.slice(7) : null;

//   if (!token) return res.status(401).json({ error: "Missing access token" });

//   try {
//     const decoded = verifyAccess(token);
//     req.user = decoded;
//     next();
//   } catch {
//     return res.status(401).json({ error: "Invalid/expired access token" });
//   }
// }

// module.exports = { requireAuth };
