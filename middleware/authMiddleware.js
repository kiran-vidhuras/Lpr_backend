const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Make sure this is imported

exports.protect = (roles = []) => {
  if (typeof roles === "string") roles = [roles];

  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Load full user from DB using ID from token
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user; // 👈 full user object

      if (process.env.NODE_ENV === "development") {
        console.log("Authenticated User:", req.user);
      }

      const userRole = user.role?.toLowerCase();
      const allowedRoles = roles.map((r) => r.toLowerCase());

      if (roles.length && !allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: "Forbidden: Access denied" });
      }

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Token expired. Please login again." });
      }
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  };
};

// const jwt = require("jsonwebtoken");

// exports.protect = (roles = []) => {
//   if (typeof roles === "string") {
//     roles = [roles];
//   }

//   return (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Not authorized, no token" });
//     }

//     const token = authHeader.split(" ")[1];

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = decoded;

//       // Debug in dev
//       if (process.env.NODE_ENV === "development") {
//         console.log("Decoded JWT:", decoded);
//       }

//       // Normalize role comparison (optional)
//       const userRole = decoded.role?.toLowerCase();
//       const allowedRoles = roles.map((r) => r.toLowerCase());

//       if (roles.length && !allowedRoles.includes(userRole)) {
//         return res.status(403).json({ message: "Forbidden: Access denied" });
//       }

//       next();
//     } catch (error) {
//       if (error.name === "TokenExpiredError") {
//         return res
//           .status(401)
//           .json({ message: "Token expired. Please login again." });
//       }
//       return res.status(401).json({ message: "Not authorized, token failed" });
//     }
//   };
// };

// // const jwt = require('jsonwebtoken');

// // exports.protect = (roles = []) => {
// //   // roles param can be a single role string or array of roles
// //   if (typeof roles === 'string') {
// //     roles = [roles];
// //   }

// //   return (req, res, next) => {
// //     const authHeader = req.headers.authorization;

// //     if (!authHeader || !authHeader.startsWith('Bearer ')) {
// //       return res.status(401).json({ message: 'Not authorized, no token' });
// //     }

// //     const token = authHeader.split(' ')[1];

// //     try {
// //       const decoded = jwt.verify(token, process.env.JWT_SECRET);
// //       req.user = decoded;

// //       if (roles.length && !roles.includes(decoded.role)) {
// //         return res.status(403).json({ message: 'Forbidden: Access denied' });
// //       }

// //       next();
// //     } catch (error) {
// //       return res.status(401).json({ message: 'Not authorized, token failed' });
// //     }
// //   };
// // };
