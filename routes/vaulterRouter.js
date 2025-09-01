import express from 'express';

import {dblogger, logger} from "../logger.js";
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import Vaulter from '../models/Vaulter.js';
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

const vaulterRouter = express.Router();

vaulterRouter.get('/new',Verify, VerifyRole(), (req, res) => {
    res.render('vaulter/newVaulter', {
        countries:countries,
        formData: req.session.formData, 
        rolePermissons: req.user?.role?.permissions
        , failMessage: req.session.failMessage, successMessage: req.session.successMessage,
        user: req.user });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering 
});

vaulterRouter.post('/new',Verify, VerifyRole(), Validate, async (req, res) => {
    try {
        const newVaulter = new Vaulter(req.body);
        await newVaulter.save()
        dblogger.db(`Vaulter ${newVaulter.name} created by user ${req.user.username}.`);
        req.session.successMessage = 'Vaulter created successfully!';
        res.redirect('/vaulter/dashboard');
    } catch (err) {
    console.error(err);

    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';

    return res.render('vaulter/newVaulter', {
        permissionList: await Permissions.find(),
      formData: req.body,
      successMessage: null,
      failMessage: errorMessage,
      card: { ...req.body, _id: req.params.id },
        user: req.user
    });
    
  }
});
  vaulterRouter.get('/dashboard',Verify, VerifyRole(), async (req, res) => {
        const vaulters = await Vaulter.find().sort({ name: 1 });
        res.render('vaulter/vaulterdash', {
            vaulters,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
        user: req.user
        });
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering 
    });


    vaulterRouter.get('/details/:id',Verify, VerifyRole(), async (req, res) => {
        try {
            console.log(req.params.id);
            const vaulter = await Vaulter.findById(req.params.id);
            if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.redirect('/vaulter/dashboard');
          }
            res.render('vaulter/vaulterDetail', {
                users: await User.find(),
                formData: vaulter,
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
            return res.redirect('/vaulter/dashboard');
        }
    });
    vaulterRouter.get('/edit/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const vaulter = await Vaulter.findById(req.params.id);
          if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.redirect('/vaulter/dashboard');
          }
          res.render('vaulter/editVaulter', {
            countries:countries,
            formData: vaulter,
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
          return res.redirect('/vaulter/dashboard');
        }
      });
      vaulterRouter.post('/edit/:id',Verify, VerifyRole(), Validate, async (req, res) => {
        try {
          const vaulter = await Vaulter.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
          dblogger.db(`Vaulter ${vaulter.name} updated by user ${req.user.username}.`);
          if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.redirect('/vaulter/dashboard');
          }
          req.session.successMessage = 'Vaulter updated successfully!';
          res.redirect('/vaulter/dashboard'
          );
        } catch (err) {
          console.error(err);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
      
          return res.render('vaulter/editVaulter', {
            permissionList: await Permissions.find(),
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            user: req.user
          });
        }
      });

      vaulterRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const vaulter = await Vaulter.findByIdAndDelete(req.params.id);
          dblogger.db(`Vaulter ${vaulter.name} deleted by user ${req.user.username}.`);
          if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.status(404).json({ message: 'Vaulter not found' });
          }
          res.status(200).json({ message: 'Vaulter deleted successfully' });
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
      vaulterRouter.delete('/deleteIncident/:id', Verify, VerifyRole(), async (req, res) => {
        try {
          const vaulter = await Vaulter.findById(req.params.id);
          dblogger.db(`Vaulter ${vaulter.name} incident deleted by user ${req.user.username}.`);
          if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.status(404).json({ message: 'Vaulter not found' });
          }
          console.log(req.body);
          
          vaulter.VaulterIncident.forEach(incident => {
            console.log('--- Incident összehasonlítás ---');
            console.log('description:', incident.description === req.body.description, incident.description, req.body.description);
            console.log('incidentType:', incident.incidentType === req.body.type, incident.incidentType, req.body.type);
          });
          
          vaulter.VaulterIncident = vaulter.VaulterIncident.filter(incident =>
            !(
              incident.description === req.body.description &&
              incident.incidentType === req.body.type             )
          );
          await Vaulter.findByIdAndUpdate(req.params.id, vaulter, { runValidators: true });
          res.status(200).json({ message: 'Incident deleted successfully' });
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
     vaulterRouter.post('/newIncident/:id',Verify,VerifyRole(), async (req,res) =>{
      try{
        const vaulter = await Vaulter.findById(req.params.id);
        dblogger.db(`Vaulter ${vaulter.Name} incident created by user ${req.user.username}.`);
        const newIncident = {
          description: req.body.description,
          incidentType: req.body.incidentType,
          date: Date.now(),
          User: req.user._id

        }    
        vaulter.VaulterIncident.push(newIncident);
        await Vaulter.findByIdAndUpdate(req.params.id, vaulter, { runValidators: true })
        res.status(200).json({ message: 'Incident added successfully!' })
      } catch (err) {
        console.error(err);
        req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
        

    });

export default vaulterRouter;