import Blacklist from "../models/Blacklist.js"; // import the Blacklist model
import jwt from "jsonwebtoken"; // import jsonwebtoken to verify the access token
import User from "../models/User.js"; // import the User model
import { SECRET_ACCESS_TOKEN, SECURE_MODE } from "../app.js"; // import the secret access token from the app.js file
import logger from "../logger.js"; // import the logger to log errors
import RoleModel from "../models/Role.js"; // import the Role model if needed
import PermissionModel from "../models/Permissions.js"; // import the Permission model if needed

export async function Verify(req, res, next) {
  try {

    // 1️⃣ Token lekérése cookie-ból vagy Authorization headerből
    const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      req.session.failMessage = "Unauthorized access. Please login.";
      return res.redirect("/login");
    }

    // 2️⃣ Blacklist ellenőrzés
    const blacklisted = await Blacklist.findOne({ token });

    if (blacklisted) {
      req.session.failMessage = "This session has been logged out.";
      return res.redirect("/login");
    }

    // 3️⃣ Token validálás
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
    } catch (err) {
      req.session.failMessage = "Invalid or expired token.";
      return res.redirect("/login");
    }

    // 4️⃣ Felhasználó lekérése az adatbázisból
    const user = await User.findById(decoded.id).populate("role");

    if (!user) {
      req.session.failMessage = "User not found.";
      return res.redirect("/login");
    }

    // 5️⃣ Rolling JWT generálása
    const newToken = jwt.sign({ id: user._id }, SECRET_ACCESS_TOKEN, { expiresIn: "90m" });

    // 6️⃣ Cookie-ba írás
    res.cookie("token", newToken, {
      httpOnly: true,
      secure: SECURE_MODE === 'true', // élesben: true
      sameSite: "lax",
      maxAge: 20 * 60 * 1000
    });

    // 7️⃣ User adatok a requesthez
    const { password, ...data } = user._doc;
    req.user = data;

    next();

  } catch (err) {
    console.error("Verify middleware catch error:", err);
    if (req.session) req.session.failMessage = "This session has expired or is invalid.";
    return res.redirect("/login");
  }
}

function urlsMatch(pattern, actual) {
    const patternParts = pattern.split('/').filter(Boolean);
    const actualParts = actual.split('/').filter(Boolean);

    if (patternParts.length !== actualParts.length) return false;

    return patternParts.every((part, i) => {
        return part.startsWith(':') || part === actualParts[i];
    });
}

export function VerifyRole() {
    return async function (req, res, next) {
        try {
            const user = req.user;
            const { role } = user;
            if (!role) {
                req.session.failMessage = "User role not found.";
                return res.redirect("/login");
            }

            const roleFromDB = await RoleModel.findById(role);

            const permissionsDocs = await PermissionModel.find({
            name: { $in: roleFromDB.permissions } // keresés az összes permission név alapján
            });

            // Most minden permission dokumentum elérhető a permissionsDocs tömbben
            const allAttachedURLs = permissionsDocs.flatMap(p => p.attachedURL);


            
            const hasPermission = allAttachedURLs.some(pattern => urlsMatch(pattern, req.originalUrl));
            if (!roleFromDB || !hasPermission)  {
                req.session.failMessage = "You do not have permission to access this resource.";
                return res.redirect(req.get('Referer') || '/login'); // vissza az előző oldalra, vagy login ha nincs
            }
            next();
        } catch (err) {

            logger.error("Internal server error in VerifyRole middleware: ", err);
            req.session.failMessage = "Internal server error.";
                return res.redirect(req.get('Referer') || '/login'); // vissza az előző oldalra, vagy login ha nincs
        }
    };
}
export async function UserIDValidator(req,res,next) {
    try {
        const userId = req.params.id;
        if (!userId) {
            req.session.failMessage = "User ID is required.";
            return res.redirect("/login");
        }
        if (userId !== req.user._id.toString()) {
            req.session.failMessage = "You do not have permission to access this resource.";
            return res.redirect(req.get('Referer') || '/login');
        }
        next();
    } catch (err) {
        console.error("UserIDValidator catch error:", err);
        req.session.failMessage = "Internal server error.";
        return res.redirect("/login");
    }
}

export async function  CheckLoggedIn(req, res, next) {
      try {
    // 1️⃣ Token lekérése cookie-ból vagy Authorization headerből
    const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
       return  next();
    }

    // 2️⃣ Blacklist ellenőrzés
    const blacklisted = await Blacklist.findOne({ token });

    if (blacklisted) {
       return  next();
    }

    // 3️⃣ Token validálás
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
    } catch (err) {
      return next(); // invalid token → tovább
    }

    // 4️⃣ Felhasználó lekérése
    const user = await User.findById(decoded.id).populate("role");
    if (!user) {
      return next(); // nincs felhasználó → tovább
    }


  



    console.info("User already logged in:", user.username);
    return res.redirect("/dashboard");
  } catch (err) {
    console.error("Verify middleware catch error:", err);
    if (req.session) req.session.failMessage = "This session has expired or is invalid.";
    return res.redirect("/login");
  }
}
