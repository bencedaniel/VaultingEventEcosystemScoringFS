import { validationResult } from "express-validator";
import { logValidation } from "../logger.js";

const Validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map(err => err.msg);
        const errorMessage = messages.join(", ");

        logValidation('FIELD_VALIDATION', errorMessage, { user: req.user?.username });

        req.session.failMessage = errorMessage;
        req.session.formData = req.body;
        return res.redirect(req.originalUrl);
    }
    next();
};

export default Validate;
