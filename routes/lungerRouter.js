import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import {
    getAllLungers,
    getLungerById,
    getLungerByIdWithPopulation,
    createLunger,
    updateLunger,
    deleteLungerIncident,
    addLungerIncident,
    getAllUsers,
    getAllPermissions
} from '../services/lungerData.js';
const countries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua & Deps",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Rep",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Congo {Democratic Rep}",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "East Timor",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland {Republic}",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Korea North",
  "Korea South",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Macedonia",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar, {Burma}",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russian Federation",
  "Rwanda",
  "St Kitts & Nevis",
  "St Lucia",
  "Saint Vincent & the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome & Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Swaziland",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tonga",
  "Trinidad & Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];

const lungerRouter = express.Router();

lungerRouter.get('/new',Verify, VerifyRole(), (req, res) => {
    res.render('lunger/newLunger', {
        countries:countries,
        formData: req.session.formData, 
        rolePermissons: req.user?.role?.permissions
        , failMessage: req.session.failMessage, successMessage: req.session.successMessage,
        user: req.user });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering 
});

lungerRouter.post('/new',Verify, VerifyRole(), async (req, res) => {
    try {
        const newLunger = await createLunger(req.body);
        logger.db(`Lunger ${newLunger.Name} created by user ${req.user.username}.`);
        req.session.successMessage = 'Lunger created successfully!';
        res.redirect('/lunger/dashboard');
    } catch (err) {
        logger.error(err + " User: "+ req.user.username);

        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';

        return res.render('lunger/newLunger', {
            permissionList: await getAllPermissions(),
            formData: req.body,
            successMessage: null,
            countries: countries,
            failMessage: errorMessage,
            card: { ...req.body, _id: req.params.id },
            user: req.user
        });
    }
});
lungerRouter.get('/dashboard',Verify, VerifyRole(), async (req, res) => {
    try {
        const lungers = await getAllLungers();
        res.render('lunger/lungerdash', {
            lungers,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        return res.redirect('/dashboard');
    }
});


lungerRouter.get('/details/:id',Verify, VerifyRole(), async (req, res) => {
    try {
        const lunger = await getLungerByIdWithPopulation(req.params.id);
        res.render('lunger/LungerDetail', {
            users: await getAllUsers(),
            formData: lunger,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        return res.redirect('/lunger/dashboard');
    }
});
lungerRouter.get('/edit/:id',Verify, VerifyRole(), async (req, res) => {
    try {
        const lunger = await getLungerById(req.params.id);
        res.render('lunger/editLunger', {
            countries: countries,
            formData: lunger,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        return res.redirect('/lunger/dashboard');
    }
});
lungerRouter.post('/edit/:id',Verify, VerifyRole(), Validate, async (req, res) => {
    try {
        const lunger = await updateLunger(req.params.id, req.body);
        logger.db(`Lunger ${lunger.Name} updated by user ${req.user.username}.`);
        req.session.successMessage = 'Lunger updated successfully!';
        res.redirect('/lunger/dashboard');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);

        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : (err.message || 'Server error');

        return res.render('lunger/editLunger', {
            permissionList: await getAllPermissions(),
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            user: req.user
        });
    }
});

     /* lungerRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const lunger = await Lunger.findByIdAndDelete(req.params.id);
          logger.db(`Lunger ${lunger.Name} deleted by user ${req.user.username}.`);
          if (!lunger) {
            req.session.failMessage = 'Lunger not found';
            return res.status(404).json({ message: 'Lunger not found' });
          }
          res.status(200).json({ message: 'Lunger deleted successfully' });
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });*/
lungerRouter.delete('/deleteIncident/:id', Verify, VerifyRole(), async (req, res) => {
    try {
        const lunger = await deleteLungerIncident(req.params.id, {
            description: req.body.description,
            type: req.body.type
        });
        logger.db(`Lunger ${lunger.Name} incident deleted by user ${req.user.username}.`);
        res.status(200).json({ message: 'Incident deleted successfully' });
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = err.message || 'Server error';
        res.status(500).json({ message: err.message || 'Server error' });
    }
});
lungerRouter.post('/newIncident/:id',Verify,VerifyRole(), async (req,res) =>{
    try {
        const lunger = await addLungerIncident(req.params.id, {
            description: req.body.description,
            incidentType: req.body.incidentType,
            userId: req.user._id,
            eventId: res.locals.selectedEvent._id
        });
        logger.db(`Lunger ${lunger.Name} incident created by user ${req.user.username}.`);
        res.status(200).json({ message: 'Incident added successfully!' });
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : (err.message || 'Server error');
        req.session.failMessage = errorMessage;
        res.status(500).json({ message: errorMessage });
    }
});

export default lungerRouter;