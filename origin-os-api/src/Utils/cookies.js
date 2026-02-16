// Utils/cookies.js

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: false,   // false for local http dev
    sameSite: "lax",
    path: "/"
  };
}
