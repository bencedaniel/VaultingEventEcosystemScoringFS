import { logger } from '../logger.js';
import {
    getAllVaulters,
    getVaulterById,
    getVaulterByIdLean,
    createVaulter,
    updateVaulter,
    updateVaulterArmNumber,
    addIncidentToVaulter,
    removeIncidentFromVaulter,
    getAllEntriesWithVaulters,
    getAllPermissions,
    getAllUsers
} from '../services/vaulterData.js';

const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua & Deps",
    "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas",
    "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize",
    "Benin", "Bhutan", "Bolivia", "Bosnia Herzegovina", "Botswana", "Brazil",
    "Brunei", "Bulgaria", "Burkina", "Burundi", "Cambodia", "Cameroon",
    "Canada", "Cape Verde", "Central African Rep", "Chad", "Chile", "China",
    "Colombia", "Comoros", "Congo", "Congo {Democratic Rep}", "Costa Rica",
    "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti",
    "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt",
    "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia",
    "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany",
    "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
    "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia",
    "Iran", "Iraq", "Ireland {Republic}", "Israel", "Italy", "Ivory Coast",
    "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
    "Korea North", "Korea South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos",
    "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
    "Lithuania", "Luxembourg", "Macedonia", "Madagascar", "Malawi", "Malaysia",
    "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
    "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
    "Morocco", "Mozambique", "Myanmar, {Burma}", "Namibia", "Nauru", "Nepal",
    "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway",
    "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay",
    "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
    "Russian Federation", "Rwanda", "St Kitts & Nevis", "St Lucia",
    "Saint Vincent & the Grenadines", "Samoa", "San Marino", "Sao Tome & Principe",
    "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone",
    "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
    "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
    "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
    "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad & Tobago", "Tunisia",
    "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
    "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
    "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen",
    "Zambia", "Zimbabwe"
];

async function getNewVaulterForm(req, res) {
    res.render('vaulter/newVaulter', {
        countries: countries,
        formData: req.session.formData,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
}

async function createNewVaulter(req, res) {
    try {
        const newVaulter = req.body;
        const armNr = {
            eventID: res.locals.selectedEvent._id,
            armNumber: req.body.ArmNr
        };
        newVaulter.ArmNr = [armNr];

        await createVaulter(newVaulter);
        req.session.successMessage = 'Vaulter created successfully!';
        res.redirect('/vaulter/dashboard');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(', ')
            : 'Server error';

        return res.render('vaulter/newVaulter', {
            permissionList: await getAllPermissions(),
            countries: countries,
            formData: req.body,
            successMessage: null,
            failMessage: errorMessage,
            card: { ...req.body, _id: req.params.id },
            user: req.user
        });
    }
}

async function getVaultersDashboard(req, res) {
    try {
        const vaulters = await getAllVaulters();
        vaulters.forEach(element => {
            element.ArmNr = element.ArmNr.filter(a => String(a.eventID) === String(res.locals.selectedEvent._id));
        });
        res.render('vaulter/vaulterdash', {
            vaulters,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Server error';
        return res.redirect('/dashboard');
    }
}

async function getVaulterDetails(req, res) {
    try {
        const eventID = res.locals.selectedEvent._id;
        const vaulter = await getVaulterById(req.params.id);
        vaulter.ArmNr = vaulter.ArmNr.filter(a => String(a.eventID) === String(eventID));
        if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.redirect('/vaulter/dashboard');
        }
        res.render('vaulter/vaulterDetail', {
            users: await getAllUsers(),
            formData: vaulter,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Server error';
        return res.redirect('/vaulter/dashboard');
    }
}

async function getEditVaulterForm(req, res) {
    try {
        const vaulter = await getVaulterByIdLean(req.params.id);
        vaulter.ArmNr = vaulter.ArmNr.filter(a => String(a.eventID) === String(res.locals.selectedEvent._id));
        if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.redirect('/vaulter/dashboard');
        }
        res.render('vaulter/editVaulter', {
            countries: countries,
            formData: vaulter,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Server error';
        return res.redirect('/vaulter/dashboard');
    }
}

async function updateVaulterById(req, res) {
    try {
        const ArmNr = req.body.ArmNr;
        delete req.body.ArmNr;

        const vaulter = await updateVaulter(req.params.id, req.body);
        await updateVaulterArmNumber(req.params.id, res.locals.selectedEvent._id, ArmNr);

        if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.redirect('/vaulter/dashboard');
        }
        req.session.successMessage = 'Vaulter updated successfully!';
        res.redirect('/vaulter/dashboard');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);

        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';

        return res.render('vaulter/editVaulter', {
            countries: countries,
            permissionList: await getAllPermissions(),
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            user: req.user
        });
    }
}

async function deleteVaulterIncident(req, res) {
    try {
        const vaulter = await getVaulterById(req.params.id);
        logger.db(`Vaulter ${vaulter.Name} incident delete requested by user ${req.user.username}.`);
        if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.status(404).json({ message: 'Vaulter not found' });
        }

        const incidentCriteria = {
            description: req.body.description,
            incidentType: req.body.incidentType,
            date: req.body.date,
            userId: req.user._id
        };

        await removeIncidentFromVaulter(req.params.id, incidentCriteria);
        res.status(200).json({ message: 'Incident deleted successfully' });
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Server error';
        res.status(500).json({ message: 'Server error' });
    }
}

async function createVaulterIncident(req, res) {
    try {
        const vaulter = await getVaulterById(req.params.id);
        logger.db(`Vaulter ${vaulter.Name} incident created by user ${req.user.username}.`);
        const newIncident = {
            description: req.body.description,
            incidentType: req.body.incidentType,
            date: Date.now(),
            User: req.user._id,
            eventID: res.locals.selectedEvent._id
        };
        await addIncidentToVaulter(req.params.id, newIncident);
        req.session.successMessage = 'Incident added successfully!';
        res.status(200).json({ message: 'Incident added successfully!' });
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        res.status(500).json({ message: errorMessage });
    }
}

async function getArmNumbersEditPage(req, res) {
    try {
        const entries = await getAllEntriesWithVaulters();
        const VaulterSet = new Set();
        entries.forEach(entry => {
            entry.vaulter.forEach(vaulter => {
                vaulter.ArmNr = vaulter.ArmNr.filter(a => String(a.eventID) === String(res.locals.selectedEvent._id));
                VaulterSet.add(vaulter);
            });
        });
        res.render('vaulter/numberedit', {
            vaulters: Array.from(VaulterSet),
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Server error';
        return res.redirect('/vaulter/dashboard');
    }
}

async function updateArmNumber(req, res) {
    try {
        await updateVaulterArmNumber(req.params.id, res.locals.selectedEvent._id, req.body.armNumber);
        res.status(200).json({ message: 'Arm number updated successfully!' });
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        res.status(500).json({ message: errorMessage });
    }
}

export default {
    getNewVaulterForm,
    createNewVaulter,
    getVaultersDashboard,
    getVaulterDetails,
    getEditVaulterForm,
    updateVaulterById,
    deleteVaulterIncident,
    createVaulterIncident,
    getArmNumbersEditPage,
    updateArmNumber
};
