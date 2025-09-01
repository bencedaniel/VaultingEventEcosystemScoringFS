import express from 'express';

import {dblogger, logger} from "../logger.js";
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import Lunger from '../models/Lunger.js';
import Permissions from '../models/Permissions.js';
import User from '../models/User.js';
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
        const newLunger = new Lunger(req.body);
        await newLunger.save()
        dblogger.db(`Lunger ${newLunger.name} created by user ${req.user.username}.`);
        req.session.successMessage = 'Lunger created successfully!';
        res.redirect('/lunger/dashboard');
    } catch (err) {
    console.error(err);

    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';

    return res.render('lunger/newLunger', {
        permissionList: await Permissions.find(),
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
        const lungers = await Lunger.find().sort({ name: 1 });
        res.render('lunger/lungerdash', {
            lungers,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
        user: req.user
        });
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering 
    });


    lungerRouter.get('/details/:id',Verify, VerifyRole(), async (req, res) => {
        try {
            console.log(req.params.id);
            const lunger = await Lunger.findById(req.params.id);
            if (!lunger) {
            req.session.failMessage = 'Lunger not found';
            return res.redirect('/lunger/dashboard');
          }
            res.render('lunger/lungerDetail', {
                users: await User.find(),
                formData: lunger,
                rolePermissons: req.user?.role?.permissions,
                failMessage: req.session.failMessage,
                successMessage: req.session.successMessage,
        user: req.user
            });
            req.session.failMessage = null; // Clear the fail message after rendering
            req.session.successMessage = null; // Clear the success message after rendering 
        } catch (err) {
            console.error(err);
            req.session.failMessage = 'Server error';
            return res.redirect('/lunger/dashboard');
        }
    });
    lungerRouter.get('/edit/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const lunger = await Lunger.findById(req.params.id);
          if (!lunger) {
            req.session.failMessage = 'Lunger not found';
            return res.redirect('/lunger/dashboard');
          }
          res.render('lunger/editLunger', {
            countries:countries,
            formData: lunger,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
        user: req.user
          });
          req.session.failMessage = null; // Clear the fail message after rendering
          req.session.successMessage = null; // Clear the success message after rendering
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          return res.redirect('/lunger/dashboard');
        }
      });
      lungerRouter.post('/edit/:id',Verify, VerifyRole(), Validate, async (req, res) => {
        try {
          const lunger = await Lunger.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
          dblogger.db(`Lunger ${lunger.name} updated by user ${req.user.username}.`);
          if (!lunger) {
            req.session.failMessage = 'Lunger not found';
            return res.redirect('/lunger/dashboard');
          }
          req.session.successMessage = 'Lunger updated successfully!';
          res.redirect('/lunger/dashboard'
          );
        } catch (err) {
          console.error(err);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
      
          return res.render('lunger/editLunger', {
            permissionList: await Permissions.find(),
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            user: req.user
          });
        }
      });

      lungerRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const lunger = await Lunger.findByIdAndDelete(req.params.id);
          dblogger.db(`Lunger ${lunger.name} deleted by user ${req.user.username}.`);
          if (!lunger) {
            req.session.failMessage = 'Lunger not found';
            return res.status(404).json({ message: 'Lunger not found' });
          }
          res.status(200).json({ message: 'Lunger deleted successfully' });
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
      lungerRouter.delete('/deleteIncident/:id', Verify, VerifyRole(), async (req, res) => {
        try {
          const lunger = await Lunger.findById(req.params.id);
          dblogger.db(`Lunger ${lunger.name} incident deleted by user ${req.user.username}.`);
          if (!lunger) {
            req.session.failMessage = 'Lunger not found';
            return res.status(404).json({ message: 'Lunger not found' });
          }
          console.log(req.body);
          
          lunger.LungerIncident.forEach(incident => {
            console.log('--- Incident összehasonlítás ---');
            console.log('description:', incident.description === req.body.description, incident.description, req.body.description);
            console.log('incidentType:', incident.incidentType === req.body.type, incident.incidentType, req.body.type);
          });
          
          lunger.LungerIncident = lunger.LungerIncident.filter(incident =>
            !(
              incident.description === req.body.description &&
              incident.incidentType === req.body.type             )
          );
          await Lunger.findByIdAndUpdate(req.params.id, lunger, { runValidators: true });
          res.status(200).json({ message: 'Incident deleted successfully' });
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
     lungerRouter.post('/newIncident/:id',Verify,VerifyRole(), async (req,res) =>{
      try{
        const lunger = await Lunger.findById(req.params.id);
        dblogger.db(`Lunger ${lunger.Name} incident created by user ${req.user.username}.`);
        const newIncident = {
          description: req.body.description,
          incidentType: req.body.incidentType,
          date: Date.now(),
          User: req.user._id

        }    
        lunger.LungerIncident.push(newIncident);
        await Lunger.findByIdAndUpdate(req.params.id, lunger, { runValidators: true })
        res.status(200).json({ message: 'Incident added successfully!' })
      } catch (err) {
        console.error(err);
        req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
        

    });

export default lungerRouter;