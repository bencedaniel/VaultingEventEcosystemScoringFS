/**
 * @route GET /creators
 * @desc Show creators page
 */
async function getCreatorsPage(req, res) {
    res.render('creators', {
        successMessage: req.session?.successMessage, 
        rolePermissons: req.user?.role.permissions,
        failMessage: req.session?.failMessage,
        formData: req.session?.formData,
        user: req?.user
    });
};

export default {
    getCreatorsPage
};
