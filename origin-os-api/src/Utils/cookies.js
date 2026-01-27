// Utils/cookies.js

function cookieOptions() {
  return {
    httpOnly: true,
    secure: false,   // MUST be false for http (local dev)
    sameSite: "lax", // correct for localhost / 127.0.0.1
    path: "/"
  };
}

module.exports = { cookieOptions };


// OLD CODE - now unused
// function cookieOptions() {
//   const isProd = process.env.NODE_ENV === "production";
//   return {
//     httpOnly: true,
//     sameSite: "lax",
//     secure: isProd,     // true in production (https)
//     path: "/"
//   };
// }

// module.exports = { cookieOptions };
