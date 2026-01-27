import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import {
    getAllHorses,
    getHorseById,
    getHorseByIdWithPopulation,
    createHorse,
    updateHorse,
    deleteHorseNote,
    addHorseNote,
    updateHorseNumbers,
    getHorsesForEvent,
    getAllPermissions
} from '../services/horseData.js';

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
        const forerr = req.body;
        forerr.box = req.body.BoxNr;
        forerr.head = req.body.HeadNr;
    try {
        const headNr = req.body.HeadNr;
        const boxNr = req.body.BoxNr;
        delete req.body.HeadNr;
        delete req.body.BoxNr;
        const newHorse = await createHorse(req.body, headNr, boxNr, res.locals.selectedEvent._id);
        logger.db(`Horse ${newHorse.Horsename} created by user ${req.user.username}.`);
        req.session.successMessage = 'Horse created successfully!';
        res.redirect('/horse/dashboard');
    } catch (err) {
    logger.error(err + " User: "+ req.user.username);

    if (err?.code === 11000) {
        // Duplicate key error
        const duplicateField = Object.keys(err.keyValue)[0];
        const errorMessage = `A horse with this ${duplicateField} already exists. Please use a different ${duplicateField}.`;
        return res.render('horse/newHorse', {
            permissionList: await getAllPermissions(),
            countries:countries,
          formData: forerr,
          successMessage: null,
          failMessage: errorMessage,
          card: { ...req.body, _id: req.params.id },
            user: req.user
        });
    }
    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';

    return res.render('horse/newHorse', {
        permissionList: await getAllPermissions(),
        countries:countries,
      formData: forerr,
      successMessage: null,
      failMessage: errorMessage,
      card: { ...req.body, _id: req.params.id },
        user: req.user
    });
    
  }
});
  HorseRouter.get('/dashboard',Verify, VerifyRole(), async (req, res) => {
        const horses = await getAllHorses();
        horses.forEach(horse => {
           horse.HeadNr = horse.HeadNr.filter(h => String(h.eventID) === String(res.locals.selectedEvent._id));
           horse.BoxNr = horse.BoxNr.filter(b => String(b.eventID) === String(res.locals.selectedEvent._id));
        });
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
            const horse = await getHorseByIdWithPopulation(req.params.id);
           horse.HeadNr = horse.HeadNr.filter(h => String(h.eventID) === String(res.locals.selectedEvent._id));
           horse.BoxNr = horse.BoxNr.filter(b => String(b.eventID) === String(res.locals.selectedEvent._id));

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
            logger.error(err + " User: "+ req.user.username);
            req.session.failMessage = err.message || 'Server error';
            return res.redirect('/horse/dashboard');
        }
    });
    HorseRouter.get('/edit/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const horse = await getHorseById(req.params.id);
           horse.HeadNr = horse.HeadNr.filter(h => String(h.eventID) === String(res.locals.selectedEvent._id));
           horse.BoxNr = horse.BoxNr.filter(b => String(b.eventID) === String(res.locals.selectedEvent._id));
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
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = err.message || 'Server error';
          return res.redirect('/horse/dashboard');
        }
      });
      HorseRouter.post('/edit/:id',Verify, VerifyRole(), Validate, async (req, res) => {
                  const forerr = req.body;
                  forerr.box = req.body.BoxNr;
                  forerr.head = req.body.HeadNr;

        try {
          const boxNr = req.body.BoxNr;
          const headNr = req.body.HeadNr;
          delete req.body.BoxNr;
          delete req.body.HeadNr;
          
          const horse = await updateHorse(req.params.id, req.body, headNr, boxNr, res.locals.selectedEvent._id);
          logger.db(`Horse ${horse.Horsename} updated by user ${req.user.username}.`);
          req.session.successMessage = 'Horse updated successfully!';
          res.redirect('/horse/dashboard'
          );
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : (err.message || 'Server error');
      
          return res.render('horse/editHorse', {
            countries:countries,
            formData: { ...forerr, _id: req.params.id },
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: req.session.successMessage,
        user: req.user
          });
        }
      });

      /* HorseRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const horse = await Horse.findByIdAndDelete(req.params.id);
          logger.db(`Horse ${horse.name} deleted by user ${req.user.username}.`);
          if (!horse) {
            req.session.failMessage = 'Horse not found';
            return res.status(404).json({ message: 'Horse not found' });
          }
          res.status(200).json({ message: 'Horse deleted successfully' });
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });*/
      HorseRouter.delete('/deleteNote/:id', Verify, VerifyRole(), async (req, res) => {
        try {
          const horse = await deleteHorseNote(req.params.id, req.body.note);
          logger.db(`Horse ${horse.name} note deleted by user ${req.user.username}.`);
          res.status(200).json({ message: 'Note deleted successfully' });
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = err.message || 'Server error';
          res.status(500).json({ message: err.message || 'Server error' });
        }
      });
     HorseRouter.post('/newNote/:id',Verify,VerifyRole(), async (req,res) =>{
      try{
        const noteData = {
          note: req.body.note,
          user: req.user._id,
          eventID: res.locals.selectedEvent._id
        };
        const horse = await addHorseNote(req.params.id, noteData);
        logger.db(`Horse ${horse.HorseName} note created by user ${req.user.username}.`);

        res.status(200).json({ message: 'Note added successfully!'})
             } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = err.message || 'Server error';
          res.status(500).json({ message: err.message || 'Server error' });
        }
        

    });



     HorseRouter.get('/numbers' ,Verify, VerifyRole(), async (req, res) => {
          try {
            const horses = await getHorsesForEvent(res.locals.selectedEvent._id);

            horses.forEach(horse => {
               horse.HeadNr = horse.HeadNr.filter(h => String(h.eventID) === String(res.locals.selectedEvent._id));
               horse.BoxNr = horse.BoxNr.filter(b => String(b.eventID) === String(res.locals.selectedEvent._id));
            });
            res.render('horse/numberedit', {
                horses,
                rolePermissons: req.user?.role?.permissions,
                failMessage: req.session.failMessage,
                successMessage: req.session.successMessage,
            user: req.user
            });
            req.session.failMessage = null; // Clear the fail message after rendering
            req.session.successMessage = null; // Clear the success message after rendering 
        } catch (err) {
              logger.error(err + " User: "+ req.user.username);
              req.session.failMessage = err.message || 'Server error';
              return res.redirect('/entry/dashboard');
            }
          });

      HorseRouter.post('/updatenums/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const horse = await updateHorseNumbers(req.params.id, req.body.headNumber, req.body.boxNumber, res.locals.selectedEvent._id);
          logger.db(`Horse ${horse.HorseName} numbers updated by user ${req.user.username}.`);

          res.status(200).json({ message: 'Numbers updated successfully!'})
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = err.message || 'Server error';
          res.status(500).json({ message: err.message || 'Server error' });
        }
      });

export default HorseRouter;