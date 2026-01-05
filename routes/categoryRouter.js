import express from 'express';

import {logger} from '../logger.js';
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
        logger.db(`Category ${newCategory.name} created by user ${req.user.username}.`);
        req.session.successMessage = 'Category created successfully!';
        res.redirect('/category/dashboard');
    } catch (err) {
    logger.error(err + " User: "+ req.user.username);

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
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          return res.redirect('/category/dashboard');
        }
      });
      categoryRouter.post('/edit/:id', Verify, VerifyRole(), Validate, async (req, res) => {
        try {
          const oldCategory = await Category.findById(req.params.id);
          const updateData = { ...req.body, _id: req.params.id };
          const category = await Category.findByIdAndDelete(req.params.id);
          if (!category) {
            req.session.failMessage = 'Category not found';
            return res.redirect('/category/dashboard');
          }
          const updated = new Category(updateData);
          
          await updated.save(); // await és try/catch-ben!
          logger.db(`Category ${category.CategoryDispName} updated by user ${req.user.username}.`);
          req.session.successMessage = 'Category updated successfully!';
          res.redirect('/category/dashboard');
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);

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

   /*   categoryRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
        try {

          const category = await Category.findByIdAndDelete(req.params.id);
          logger.db(`Category ${category.name} deleted by user ${req.user.username}.`);
          if (!category) {
            req.session.failMessage = 'Category not found';
            return res.status(404).json({ message: 'Category not found' });
          }
          res.status(200).json({ message: 'Category deleted successfully' });
        } catch (err) {
          logger.error(err + " User: "+ req.user.username);
          req.session.failMessage = 'Server error';
          res.status(500).json({ message: 'Server error' });
        }
      });*/
  

export default categoryRouter;