import express from 'express';

import {logger} from '../logger.js';
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
        logger.db(`Vaulter ${newVaulter.name} created by user ${req.user.username}.`);
        req.session.successMessage = 'Vaulter created successfully!';
        res.redirect('/vaulter/dashboard');
    } catch (err) {
    logger.error(err + " User: "+ req.user.username);

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
            logger.error(err + " User: "+ req.user.username);
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
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          return res.redirect('/vaulter/dashboard');
        }
      });
      vaulterRouter.post('/edit/:id',Verify, VerifyRole(), Validate, async (req, res) => {
        try {
          const vaulter = await Vaulter.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
          logger.db(`Vaulter ${vaulter.name} updated by user ${req.user.username}.`);
          if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.redirect('/vaulter/dashboard');
          }
          req.session.successMessage = 'Vaulter updated successfully!';
          res.redirect('/vaulter/dashboard'
          );
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
      
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

      /* vaulterRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const vaulter = await Vaulter.findByIdAndDelete(req.params.id);
          logger.db(`Vaulter ${vaulter.name} deleted by user ${req.user.username}.`);
          if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.status(404).json({ message: 'Vaulter not found' });
          }
          res.status(200).json({ message: 'Vaulter deleted successfully' });
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });*/
      vaulterRouter.delete('/deleteIncident/:id', Verify, VerifyRole(), async (req, res) => {
        try {
          const vaulter = await Vaulter.findById(req.params.id);
          logger.db(`Vaulter ${vaulter.Name} incident delete requested by user ${req.user.username}.`);
          if (!vaulter) {
            req.session.failMessage = 'Vaulter not found';
            return res.status(404).json({ message: 'Vaulter not found' });
          }


          // Helper: parse many date formats to ms (fallback tries to extract y,m,d,h,m,s)
          const parseDateToMs = (input) => {
            if (!input && input !== 0) return null;
            if (typeof input === 'number') return input;
            const d1 = new Date(input);
            if (!Number.isNaN(d1.getTime())) return d1.getTime();

            // try to extract components like "2025. 11. 05. 12:44:01" or "2025-11-05 12:44:01"
            const m = String(input).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}):(\d{2}):(\d{2})/);
            if (m) {
              const [ , y, mo, da, hh, mm, ss ] = m;
              const d2 = new Date(Number(y), Number(mo)-1, Number(da), Number(hh), Number(mm), Number(ss));
              if (!Number.isNaN(d2.getTime())) return d2.getTime();
            }

            // try shorter pattern without seconds
            const m2 = String(input).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}):(\d{2})/);
            if (m2) {
              const [ , y, mo, da, hh, mm ] = m2;
              const d3 = new Date(Number(y), Number(mo)-1, Number(da), Number(hh), Number(mm));
              if (!Number.isNaN(d3.getTime())) return d3.getTime();
            }

            return null;
          };

          const reqDateMs = parseDateToMs(req.body.date);
          const DATE_TOLERANCE_MS = 20 * 1000; // 20s tolerance (adjust as needed)

          vaulter.VaulterIncident = vaulter.VaulterIncident.filter(incident => {
            const incDesc = String(incident.description || '');
            const incType = String(incident.incidentType || '');
            // support both `user` and `User` as stored in DB
            const incUser = String(incident.user || incident.User || '');
            const incDateMs = parseDateToMs(incident.date);

            const descMatch = incDesc === String(req.body.description || '');
            const typeMatch = incType === String(req.body.incidentType || req.body.type || '');
            const userMatch = incUser === String(req.user._id);

            let dateMatch = false;
            if (reqDateMs === null) {
              // if client didn't send a date, ignore date in matching
              dateMatch = true;
            } else if (incDateMs === null) {
              // if incident date is not set, consider it a match (or handle as needed)
              dateMatch = true;
            } else {
              // check if dates are the same within the tolerance
              dateMatch = Math.abs(incDateMs - reqDateMs) <= DATE_TOLERANCE_MS;
            }

            const matchesAll = descMatch && typeMatch && userMatch && dateMatch;


            // keep incidents that do NOT match all criteria
            return !matchesAll;
          });

          // persist
          await Vaulter.findByIdAndUpdate(req.params.id, vaulter, { runValidators: true });
           res.status(200).json({ message: 'Incident deleted successfully' });
         } catch (err) {
           logger.error(err + " User: "+ req.user.username);
           req.session.failMessage = 'Server error';
           res.status(500).json({ message: 'Server error' });
         }
       });
     vaulterRouter.post('/newIncident/:id',Verify,VerifyRole(), async (req,res) =>{
      try{
        const vaulter = await Vaulter.findById(req.params.id);
        logger.db(`Vaulter ${vaulter.Name} incident created by user ${req.user.username}.`);
        const newIncident = {
          description: req.body.description,
          incidentType: req.body.incidentType,
          date: Date.now(),
          User: req.user._id,
          eventID: res.locals.selectedEvent._id

        }    
        vaulter.VaulterIncident.push(newIncident);
        await Vaulter.findByIdAndUpdate(req.params.id, vaulter, { runValidators: true })
        req.session.successMessage = 'Incident added successfully!';
        res.status(200).json({ message: 'Incident added successfully!' })
      } catch (err) {
        logger.error(err + " User: "+ req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
          res.status(500).json({ message: errorMessage });
        }
        

    });

export default vaulterRouter;