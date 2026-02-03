import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
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
} from '../DataServices/lungerData.js';

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


const renderNew = (req, res) => {
  res.render('lunger/newLunger', {
    countries: countries,
    formData: req.session.formData,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
};

const createNew = asyncHandler(async (req, res) => {
  const newLunger = await createLunger(req.body);
  logOperation('LUNGER_CREATE', `Lunger created: ${newLunger.Name}`, req.user.username, HTTP_STATUS.CREATED);
  req.session.successMessage = MESSAGES.SUCCESS.LUNGER_CREATED;
  res.redirect('/lunger/dashboard');
});

const dashboard = asyncHandler(async (req, res) => {
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
});

const details = asyncHandler(async (req, res) => {
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
});

const editGet = asyncHandler(async (req, res) => {
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
});

const editPost = asyncHandler(async (req, res) => {
  const lunger = await updateLunger(req.params.id, req.body);
  logOperation('LUNGER_UPDATE', `Lunger updated: ${lunger.Name}`, req.user.username, HTTP_STATUS.OK);
  req.session.successMessage = MESSAGES.SUCCESS.LUNGER_UPDATED;
  res.redirect('/lunger/dashboard');
});

const deleteIncident = asyncHandler(async (req, res) => {
  const lunger = await deleteLungerIncident(req.params.id, {
    description: req.body.description,
    type: req.body.type
  });
  logOperation('LUNGER_UPDATE', `Lunger updated: ${lunger.Name}`, req.user.username, HTTP_STATUS.OK);
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.INCIDENT_DELETED });
});

const newIncidentPost = asyncHandler(async (req, res) => {
  const lunger = await addLungerIncident(req.params.id, {
    description: req.body.description,
    incidentType: req.body.incidentType,
    userId: req.user._id,
    eventId: res.locals.selectedEvent._id
  });
  logOperation('LUNGER_UPDATE', `Lunger incident created: ${lunger.Name}`, req.user.username, HTTP_STATUS.CREATED);
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.INCIDENT_ADDED });
});

export default {
  renderNew,
  createNew,
  dashboard,
  details,
  editGet,
  editPost,
  deleteIncident,
  newIncidentPost
};
