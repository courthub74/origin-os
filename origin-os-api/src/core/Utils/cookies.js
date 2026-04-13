// Utils/cookies.js

// core/utils/cookies.js

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: false, // false for local http dev
    sameSite: "lax",
    path: "/"
  };
}

export function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    ...cookieOptions(),
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", cookieOptions());
}