/**
 * @route GET /login
 * @desc Show login page
 */
async function getLoginPage(req, res) {
    const failMessage = req.session.failMessage;
    res.render("login", { 
        failMessage, 
        rolePermissons: req.user?.role.permissions, 
        successMessage: req.session.successMessage
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
};

export default {
    getLoginPage
};
