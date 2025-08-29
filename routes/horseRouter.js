import express from 'express';

import logger from '../logger.js';
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import Horse from '../models/Horse.js';
import Permissions from '../models/Permissions.js';
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

const HorseRouter = express.Router();

HorseRouter.get('/new',Verify, VerifyRole(), (req, res) => {
    res.render('horse/newHorse', {
        countries:countries,
        formData: req.session.formData, 
        rolePermissons: req.user?.role?.permissions
        , failMessage: req.session.failMessage, successMessage: req.session.successMessage,
        user: req.user });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering 
});

HorseRouter.post('/new',Verify, VerifyRole(), Validate, async (req, res) => {
    try {
        const newHorse = new Horse(req.body);
        await newHorse.save()
        req.session.successMessage = 'Horse created successfully!';
        res.redirect('/horse/new');
    } catch (err) {
    console.error(err);

    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';

    return res.render('horse/newHorse', {
        permissionList: await Permissions.find(),
      formData: req.body,
      successMessage: null,
      failMessage: errorMessage,
      card: { ...req.body, _id: req.params.id },
        user: req.user
    });
    
  }
});
  HorseRouter.get('/dashboard',Verify, VerifyRole(), async (req, res) => {
        const horses = await Horse.find().sort({ name: 1 });
        res.render('horse/horsedash', {
            horses,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
        user: req.user
        });
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering 
    });


    HorseRouter.get('/details/:id',Verify, VerifyRole(), async (req, res) => {
        try {
            console.log(req.params.id);
            const horse = await Horse.findById(req.params.id);
            if (!horse) {
            req.session.failMessage = 'Horse not found';
            return res.redirect('/horse/dashboard');
          }
            res.render('horse/horseDetail', {
                formData: horse,
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
            return res.redirect('/horse/dashboard');
        }
    });
    HorseRouter.get('/edit/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const horse = await Horse.findById(req.params.id);
          if (!horse) {
            req.session.failMessage = 'Horse not found';
            return res.redirect('/horse/dashboard');
          }
          res.render('horse/editHorse', {
            countries:countries,
            formData: horse,
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
          return res.redirect('/horse/dashboard');
        }
      });
      HorseRouter.post('/edit/:id',Verify, VerifyRole(), Validate, async (req, res) => {
        try {
          const horse = await Horse.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
          if (!horse) {
            req.session.failMessage = 'Horse not found';
            return res.redirect('/horse/dashboard');
          }
          req.session.successMessage = 'Horse updated successfully!';
          res.redirect('/horse/dashboard'
          );
        } catch (err) {
          console.error(err);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
      
          return res.render('horse/editHorse', {
            permissionList: await Permissions.find(),
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            user: req.user
          });
        }
      });

      HorseRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const horse = await Horse.findByIdAndDelete(req.params.id);
          if (!horse) {
            req.session.failMessage = 'Horse not found';
            return res.status(404).json({ message: 'Horse not found' });
          }
          res.status(200).json({ message: 'Horse deleted successfully' });
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
      HorseRouter.delete('/deleteNote/:id', Verify, VerifyRole(), async (req, res) => {
        try {
          const horse = await Horse.findById(req.params.id);
          if (!horse) {
            req.session.failMessage = 'Horse not found';
            return res.status(404).json({ message: 'Horse not found' });
          }
          horse.Notes = horse.Notes.filter(note => note.note !== req.body.note);
          await Horse.findByIdAndUpdate(req.params.id, horse, { runValidators: true });
          res.status(200).json({ message: 'Note deleted successfully' });
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
     HorseRouter.post('/newNote/:id',Verify,VerifyRole(), async (req,res) =>{
      try{
        console.log('start')
        const horse = await Horse.findById(req.params.id);
        const newNote = {
          note: req.body.note,
          timestamp: Date.now()
        }    
        console.log(horse)
        horse.Notes.push(newNote);
        await Horse.findByIdAndUpdate(req.params.id, horse, { runValidators: true})
        res.status(200).json({ message: 'Note added successfully!'})
             } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
        

    });

export default HorseRouter;