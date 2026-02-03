import jwt from "jsonwebtoken";
import { SECRET_ACCESS_TOKEN, SECURE_MODE } from "../app.js";
import { logger, logAuth, logError, logWarn } from "../logger.js";
import { asyncHandler } from "./asyncHandler.js";
import { JWT_CONFIG, COOKIE_CONFIG, HTTP_STATUS, MESSAGES } from "../config/index.js";
import { 
  isTokenBlacklisted, 
  blacklistToken, 
  findUserByIdWithRole,
  getRoleWithPermissions 
} from "../DataServices/authMiddlewareData.js";

export const Verify = asyncHandler(async (req, res, next) => {
  // 1️⃣ Token lekérése cookie-ból vagy Authorization headerből
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    logAuth('VERIFY_TOKEN', 'unknown', false, 'TOKEN_MISSING');
    req.session.failMessage = MESSAGES.AUTH.SESSION_EXPIRED;
    return res.redirect("/login");
  }
  
  // 2️⃣ Blacklist ellenőrzés
  const blacklisted = await isTokenBlacklisted(token);

  if (blacklisted) {
    logAuth('VERIFY_TOKEN', 'unknown', false, 'TOKEN_BLACKLISTED');
    req.session.failMessage = MESSAGES.AUTH.SESSION_LOGGED_OUT;
    return res.redirect("/login");
  }

  // 3️⃣ Token validálás
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
  } catch (err) {
    logError('TOKEN_VERIFICATION_FAILED', err.message, 'Token validation');
    req.session.failMessage = MESSAGES.AUTH.INVALID_TOKEN;
    return res.redirect("/login");
  }

  // 4️⃣ Felhasználó lekérése az adatbázisból
  const user = await findUserByIdWithRole(decoded.id);

  if (!user) {
    logAuth('VERIFY_TOKEN', decoded.id, false, 'USER_NOT_FOUND');
    req.session.failMessage = MESSAGES.AUTH.USER_NOT_FOUND;
    return res.redirect("/login");
  }
  
  if(!user.active){
    logAuth('VERIFY_TOKEN', user.username, false, 'ACCOUNT_DEACTIVATED');
    req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
    const authHeader = req.headers['cookie']; // get the session cookie from request header
    if (!authHeader) {
      req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    } 
    const cookie = authHeader.split('=')[1]; // If there is, split the cookie string to get the actual jwt token
    const accessToken = cookie.split(';')[0];
    const checkIfBlacklisted = await isTokenBlacklisted(accessToken); // Check if that token is blacklisted
    // if true, send a no content response.
    if (checkIfBlacklisted){
      req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    } 
    // otherwise blacklist token
    await blacklistToken(accessToken);
    res.clearCookie(COOKIE_CONFIG.TOKEN_NAME, {
      ...COOKIE_CONFIG.OPTIONS,
      secure: process.env.SECURE_MODE === 'true'
    });
    req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
    return res.redirect('/login'); // redirect to home page
  }

  // 5️⃣ Rolling JWT generálása
  const newToken = jwt.sign({ id: user._id }, SECRET_ACCESS_TOKEN, { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY });

  // 6️⃣ Cookie-ba írás
  res.cookie(COOKIE_CONFIG.TOKEN_NAME, newToken, {
    ...COOKIE_CONFIG.OPTIONS,
    secure: SECURE_MODE === 'true', // élesben: true
    maxAge: JWT_CONFIG.COOKIE_MAX_AGE
  });

  // 7️⃣ User adatok a requesthez
  const { password, ...data } = user._doc;
  req.user = data;

  next();
});
export const VerifyNoerror = asyncHandler(async (req, res, next) => {
  // 1️⃣ Token lekérése cookie-ból vagy Authorization headerből
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.redirect("/login");
  }

  next();
});

function urlsMatch(pattern, actual) {
    const patternParts = pattern.split('/').filter(Boolean);
    const actualParts = actual.split('/').filter(Boolean);

    if (patternParts.length !== actualParts.length) return false;

    return patternParts.every((part, i) => {
        return part.startsWith(':') || part === actualParts[i];
    });
}

export function VerifyRole() {
    return asyncHandler(async (req, res, next) => {
        const user = req.user;
        const { role } = user;
        if (!role) {
            req.session.failMessage = MESSAGES.AUTH.USER_ROLE_NOT_FOUND;
            return res.redirect("/login");
        }

        const roleData = await getRoleWithPermissions(role);
        if (!roleData) {
            req.session.failMessage = MESSAGES.AUTH.ROLE_NOT_FOUND;
            return res.redirect("/login");
        }

        const { role: roleFromDB, permissions: permissionsDocs } = roleData;

        // Most minden permission dokumentum elérhető a permissionsDocs tömbben
        const allAttachedURLs = permissionsDocs.flatMap(p => p.attachedURL);

        let hasPermission = false
        
        const perm = allAttachedURLs.find(pattern => urlsMatch(pattern.url, req.originalUrl));
        if (!perm) {
          hasPermission = false;
        } else {
          req.session.parent = perm.parent;
          hasPermission = true;
            res.locals.parent = (typeof req.session?.parent === 'string' && req.session.parent.trim() !== '')
              ? req.session.parent
              : '/dashboard';
        }
        if (!roleFromDB || !hasPermission)  {
            logWarn('PERMISSION_DENIED', `User ${user.username} with role ${roleFromDB ? roleFromDB.roleName : 'unknown'} tried to access ${req.originalUrl} without permission.`);
            req.session.failMessage = MESSAGES.AUTH.PERMISSION_DENIED;
            return res.redirect(req.get('Referer') || '/dashboard'); // vissza az előző oldalra, vagy login ha nincs
          }
        next();
    });
}
export const UserIDValidator = asyncHandler(async (req, res, next) => {
    const userId = req.params.id;
    if (!userId) {
        req.session.failMessage = MESSAGES.AUTH.USER_ID_REQUIRED;
        return res.redirect("/login");
    }
    if (userId !== req.user._id.toString()) {
        req.session.failMessage = MESSAGES.AUTH.PERMISSION_DENIED;
        return res.redirect(req.get('Referer') || '/login');
    }
    next();
});

export const StoreUserWithoutValidation = asyncHandler(async (req, res, next) => {
  // 1️⃣ Token lekérése cookie-ból vagy Authorization headerből
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return next();
  }

  // 2️⃣ Blacklist ellenőrzés
  const blacklisted = await isTokenBlacklisted(token);

  if (blacklisted) {
    return next();
  }

  // 3️⃣ Token validálás
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
  } catch (err) {
    return next();
  }

  // 4️⃣ Felhasználó lekérése az adatbázisból
  const user = await findUserByIdWithRole(decoded.id);

  if (!user) {
    return next();
  }

  // 5️⃣ Rolling JWT generálása
  const newToken = jwt.sign({ id: user._id }, SECRET_ACCESS_TOKEN, { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY });

  // 6️⃣ Cookie-ba írás
  res.cookie(COOKIE_CONFIG.TOKEN_NAME, newToken, {
    ...COOKIE_CONFIG.OPTIONS,
    secure: SECURE_MODE === 'true', // élesben: true
    maxAge: JWT_CONFIG.COOKIE_MAX_AGE
  });

  // 7️⃣ User adatok a requesthez
  const { password, ...data } = user._doc;
  req.user = data;

  next();
});



export const CheckLoggedIn = asyncHandler(async (req, res, next) => {
  // 1️⃣ Token lekérése cookie-ból vagy Authorization headerből
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return next();
  }

  // 2️⃣ Blacklist ellenőrzés
  const blacklisted = await isTokenBlacklisted(token);

  if (blacklisted) {
    return next();
  }

  // 3️⃣ Token validálás
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
  } catch (err) {
    return next(); // invalid token → tovább
  }

  // 4️⃣ Felhasználó lekérése
  const user = await findUserByIdWithRole(decoded.id);
  if (!user) {
    return next(); // nincs felhasználó → tovább
  }

  console.info("User already logged in:", user.username);
  return res.redirect("/dashboard");
});
