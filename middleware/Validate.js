import { validationResult } from "express-validator";
import {logger} from "../logger.js";

const Validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map(err => err.msg);
        const errorMessage = messages.join(", ");

        logger.error("Validation error: "+errorMessage +" User: "+ req.user?.username);

        req.session.failMessage = errorMessage;
        req.session.formData = req.body;
        return res.redirect(req.originalUrl);
    }
    next();
};

export default Validate;
