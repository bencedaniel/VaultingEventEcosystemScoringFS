import express from 'express';

import {dblogger, logger} from "../logger.js";
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import Category from '../models/Category.js';
import Permissions from '../models/Permissions.js';
import User from '../models/User.js';

const categoryRouter = express.Router();

categoryRouter.get('/new',Verify, VerifyRole(), (req, res) => {
    res.render('category/newCategory', {
        formData: req.session.formData, 
        rolePermissons: req.user?.role?.permissions
        , failMessage: req.session.failMessage, successMessage: req.session.successMessage,
        user: req.user });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering 
});

categoryRouter.post('/new',Verify, VerifyRole(), async (req, res) => {
    try {
        console.log(req.body);
        const newCategory = new Category(req.body);
        await newCategory.save()
        dblogger.db(`Category ${newCategory.name} created by user ${req.user.username}.`);
        req.session.successMessage = 'Category created successfully!';
        res.redirect('/category/dashboard');
    } catch (err) {
    console.error(err);

    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';

    return res.render('category/newCategory', {
        permissionList: await Permissions.find(),
      formData: req.body,
      successMessage: null,
      failMessage: errorMessage,
      card: { ...req.body, _id: req.params.id },
        user: req.user
    });
    
  }
});
  categoryRouter.get('/dashboard',Verify, VerifyRole(), async (req, res) => {
        const categorys = await Category.find().sort({ name: 1 });
        res.render('category/categorydash', {
            categorys,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
        user: req.user
        });
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering 
    });


    categoryRouter.get('/edit/:id',Verify, VerifyRole(), async (req, res) => {
        try {
          const category = await Category.findById(req.params.id);
          if (!category) {
            req.session.failMessage = 'Category not found';
            return res.redirect('/category/dashboard');
          }
          res.render('category/editCategory', {
            formData: category,
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
          return res.redirect('/category/dashboard');
        }
      });
      categoryRouter.post('/edit/:id',Verify, VerifyRole(), Validate, async (req, res) => {
        try {
          console.log(req.body);
          const updateData = { ...req.body };
          updateData._id = req.params.id; // Ensure the ID is set for validation
          const category = await Category.findByIdAndDelete(req.params.id);
          const updated = new Category(updateData); 
          updated.save();
          dblogger.db(`Category ${category.CategoryDispName} updated by user ${req.user.username}.`);
          if (!category) {
            req.session.failMessage = 'Category not found';
            return res.redirect('/category/dashboard');
          }
          req.session.successMessage = 'Category updated successfully!';
          res.redirect('/category/dashboard'
          );
        } catch (err) {
          console.error(err);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
      
          return res.render('category/editCategory', {
            permissionList: await Permissions.find(),
            formData: { ...req.body, _id: req.params.id },
            successMessage: null,
            failMessage: errorMessage,
            user: req.user
          });
        }
      });

      categoryRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const category = await Category.findByIdAndDelete(req.params.id);
          dblogger.db(`Category ${category.name} deleted by user ${req.user.username}.`);
          if (!category) {
            req.session.failMessage = 'Category not found';
            return res.status(404).json({ message: 'Category not found' });
          }
          res.status(200).json({ message: 'Category deleted successfully' });
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
      categoryRouter.delete('/deleteIncident/:id', Verify, VerifyRole(), async (req, res) => {
        try {
          const category = await Category.findById(req.params.id);
          dblogger.db(`Category ${category.name} incident deleted by user ${req.user.username}.`);
          if (!category) {
            req.session.failMessage = 'Category not found';
            return res.status(404).json({ message: 'Category not found' });
          }
          

          
          category.CategoryIncident = category.CategoryIncident.filter(incident =>
            !(
              incident.description === req.body.description &&
              incident.incidentType === req.body.type             )
          );
          await Category.findByIdAndUpdate(req.params.id, category, { runValidators: true });
          res.status(200).json({ message: 'Incident deleted successfully' });
        } catch (err) {
          console.error(err);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });
     categoryRouter.post('/newIncident/:id',Verify,VerifyRole(), async (req,res) =>{
      try{
        const category = await Category.findById(req.params.id);
        dblogger.db(`Category ${category.Name} incident created by user ${req.user.username}.`);
        const newIncident = {
          description: req.body.description,
          incidentType: req.body.incidentType,
          date: Date.now(),
          User: req.user._id

        }    
        category.CategoryIncident.push(newIncident);
        await Category.findByIdAndUpdate(req.params.id, category, { runValidators: true })
        res.status(200).json({ message: 'Incident added successfully!' })
      } catch (err) {
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
          req.session.failMessage = errorMessage;
        res.status(500).json({ message: errorMessage });
        }
        

    });

export default categoryRouter;