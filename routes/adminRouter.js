import express from 'express';

import {dblogger, logger} from "../logger.js";
import { Login } from "../controllers/auth.js";
import { Logout } from "../controllers/auth.js";
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import { Register } from "../controllers/auth.js";
import Role from "../models/Role.js"; // Import the Role model
import User from "../models/User.js"; // Import the User model
const adminRouter = express.Router();
import bcrypt from 'bcrypt';
import Permissions from '../models/Permissions.js';
import DashCards from '../models/DashCards.js';






adminRouter.get("/newUser",Verify,VerifyRole(), async (req, res) => {
    const roles = await Role.find();
    const userrole = req.user?.role.permissions; // Safe check for req.user
    res.render("admin/newUser", {
        rolePermissons: userrole,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        roleList: roles,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.successMessage = null;
    req.session.formData = null;
    req.session.failMessage = null;
});
adminRouter.post(
    "/newUser", 
    Verify,
    VerifyRole(),
    Validate,
    Register
);


adminRouter.get("/dashboard/users", Verify, VerifyRole(), async (req, res) => {
    const users = await User.find().populate('role', 'roleName'); // Populate the Role field with the role name
    const rolePermissons = req.user.role.permissions; // Safe check for req.user

    res.render("admin/userdash", {

        rolePermissons: rolePermissons,
        users: users,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering

});
adminRouter.get('/editUser/:id',Verify,VerifyRole(), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.render('admin/editUser', {failMessage: req.session.failMessage, 
            formData: user,userrole: req.user.role,
            roleList: await Role.find(),
            rolePermissons: req.user.role.permissions,
            successMessage: req.session.successMessage,
        user: req.user});
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering

    } catch (err) {
        logger.error(err);
        res.status(500).send('Server Error');
    }
});

adminRouter.post('/editUser/:id',Verify,VerifyRole() , async (req, res) => {
    try {
        
        const updateData = { ...req.body };
        if (req.body.password=== '') {
            const user = await User.findById(req.params.id);
            updateData.password = user.password;
        }else{
            updateData.password = await bcrypt.hash(req.body.password, 10);
        }
        await User.findByIdAndUpdate(req.params.id, updateData, { runValidators: true });
        dblogger.db(`User ${req.body.username} updated by user ${req.user.username}.`);
        req.session.successMessage = 'User modified successfully!';
        res.redirect('/admin/dashboard/users');
    } catch (err) {
        console.error(err);
        if (err.errors || err.code === 11000) {

            const errorMessage = err.errors
                ? Object.values(err.errors).map(error => error.message).join(' ')
                : 'Ez a User már létezik!';
            return res.render('admin/editUser', {
                formData: req.body,
                successMessage: null,
                failMessage: errorMessage,
                user: req.user
            });
            
        }
        logger.error(err);
        res.status(500).send('Server Error');
    }
});


adminRouter.get("/dashboard", Verify,VerifyRole(), async (req, res) => {
    const rolePermissons = req.user.role.permissions; // Safe check for req.user
    res.render("admin/admindash", {
        cardsFromDB: await DashCards.find({ dashtype: 'admin' }).sort({ priority: 1 }),
        userCount: await User.countDocuments(),
        permissionCount: await Permissions.countDocuments(),
        roleCount: await Role.countDocuments(),
        rolePermissons: rolePermissons,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering
}); 


adminRouter.delete('/deleteUser/:userId', Verify,VerifyRole(), async (req, res) => {
    try {
        const UserId = req.params.userId;
        await User.findByIdAndDelete(UserId);
        dblogger.db(`User ${UserId} deleted by user ${req.user.username}.`);
        req.session.successMessage = 'User successfully deleted.';
        res.status(200).send('User deleted.');
    } catch (err) {
        logger.error("Err:" +err.toString());
        res.status(500).send('Server Error');
    }
});


//ROLE MANAGEMENT ROUTES
adminRouter.get("/dashboard/roles", Verify, VerifyRole(), async (req, res) => {
    try {
                const roles = await Role.find();

        const RoleNumList = [];
        for (const role of roles) {
            const CountUsersbyRoleId = await User.countDocuments({ role: role._id });
            RoleNumList.push({ roleID: role._id, count: CountUsersbyRoleId });
        }
        res.render("admin/roledash", {
            rolenumlist: RoleNumList,
            rolePermissons: req.user.role.permissions,
            roles: roles,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
        user: req.user
        });
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering
    } catch (err) {
        logger.error(err);
        res.status(500).send('Server Error');
    }
});
adminRouter.get("/newRole", Verify, VerifyRole(), async (req, res) => {
    
    const permissions = await Permissions.find();
    res.render("admin/newRole", {
        permissions: permissions,
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.formData = null; // Clear the form data after rendering
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering
});

adminRouter.post("/newRole", Verify, VerifyRole(), async (req, res) => {
    try {
        const { roleName, description, permissions } = req.body;
        const newRole = new Role({
            roleName,
            description,
            permissions
        });
        await newRole.save();
        dblogger.db(`Role ${newRole.roleName} created by user ${req.user.username}.`);
        req.session.successMessage = 'Role created successfully.';
        res.redirect('/admin/dashboard/roles');
    } catch (err) {
        logger.error(err);
        req.session.failMessage = 'Error creating role. Please try again.';
        req.session.formData = req.body; // Save form data to session
        res.redirect('/admin/newRole');
    }
});

adminRouter.get('/editRole/:id', Verify, VerifyRole(), async (req, res) => {
    try {
        const roles = await Role.find();
        const permissions = await Permissions.find();
        const role = await Role.findById(req.params.id);
        if (!role) {
            req.session.failMessage = 'Role not found.';
            return res.redirect('/admin/dashboard/roles');
        }

        res.render('admin/editRole', {
            permissions: permissions,
            rolePermissons: req.user.role.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            formData: role,
            user: req.user
        });
        req.session.successMessage = null; // Clear the success message after rendering
        req.session.failMessage = null; // Clear the fail message after rendering
    } catch (err) {
        logger.error(err);
        res.status(500).send('Server Error');
    }
});

adminRouter.post('/editRole/:id', Verify, VerifyRole(), async (req, res) => {
    try {
        const { roleName, description, permissions } = req.body;
        
        const updatedRole = await Role.findByIdAndUpdate(req.params.id, {
            roleName,
            description,
            permissions
        }, { runValidators: true });
        dblogger.db(`Role ${roleName} updated by user ${req.user.username}.`);
        if (!updatedRole) {
            req.session.failMessage = 'Role not found.';
            return res.redirect('/admin/dashboard/roles');
        }

        req.session.successMessage = 'Role updated successfully.';
        res.redirect('/admin/dashboard/roles');
    } catch (err) {
        logger.error(err);
        req.session.failMessage = 'Error updating role. Please try again.';
        res.redirect(`/admin/editRole/${req.params.id}`);
    }
}); 

adminRouter.delete('/deleteRole/:roleId', Verify, VerifyRole(), async (req, res) => {
    try {
        const roleId = req.params.roleId;
        const role = await Role.findById(roleId);
        if (!role) {
            req.session.failMessage = 'Role not found.';
            return res.status(404).send('Role not found.');
        }

        // Check if the role is assigned to any user
        const userCount = await User.countDocuments({ role: roleId });
        if (userCount > 0) {
            req.session.failMessage = 'Cannot delete role. It is assigned to one or more users.';
            return res.status(400).send('Cannot delete role. It is assigned to one or more users.');
        }

        await Role.findByIdAndDelete(roleId);
        dblogger.db(`Role ${role.roleName} deleted by user ${req.user.username}.`);
        req.session.successMessage = 'Role successfully deleted.';
        res.status(200).send('Role deleted.');
    } catch (err) {
        logger.error("Err:" + err.toString());
        res.status(500).send('Server Error');
    }
});


// PERMISSION MANAGEMENT ROUTES
adminRouter.get("/dashboard/permissions", Verify, VerifyRole(), async (req, res) => {
    try {
        const permissions = await Permissions.find();
        const RoleList = await Role.find();
        const RolePermNumList = [];
        for (const perm of permissions) {
            let CountRolesbyPermissionId = 0;
            for (const role of RoleList) {
               if( role.permissions.includes(perm.name)){
                    CountRolesbyPermissionId++;
                }
               
            }
            RolePermNumList.push({ permID: perm._id, count: CountRolesbyPermissionId });
        }
        res.render("admin/permdash", {
            rolepermNumList: RolePermNumList,
            rolePermissons: req.user.role.permissions,
            permissions: permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering

    } catch (err) {
        logger.error(err);
        res.status(500).send('Server Error');
    }


});
adminRouter.get("/newPermission", Verify, VerifyRole(), (req, res) => {
    res.render("admin/newPerm", {
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.successMessage = null;
    req.session.formData = null; // Clear the form data after rendering
    req.session.failMessage = null; // Clear the fail message after rendering
});

adminRouter.post("/newPermission", Verify, VerifyRole(), async (req, res) => {
    try {
        const {name, displayName, attachedURL, requestType } = req.body;
        const newPermission = new Permissions({
            name,
            displayName,
            attachedURL,
            requestType
        });
        await newPermission.save();
        dblogger.db(`Permission ${newPermission.name} created by user ${req.user.username}.`);
        req.session.successMessage = 'Permission created successfully.';
        res.redirect('/admin/dashboard/permissions');
    } catch (err) {
        logger.error(err);
        req.session.failMessage = 'Error creating permission. Please try again.';
        req.session.formData = req.body; // Save form data to session
        res.redirect('/admin/newPermission');
    }
});

adminRouter.get('/editPermission/:id', Verify, VerifyRole(), async (req, res) => {
    try {
        const permission = await Permissions.findById(req.params.id);
        if (!permission) {
            req.session.failMessage = 'Permission not found.';
            return res.redirect('/admin/dashboard/permissions');
        }
        res.render('admin/editPerm', {
            rolePermissons: req.user.role.permissions,
            failMessage: req.session.failMessage,
            formData: permission,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null; // Clear the success message after rendering
    } catch (err) {
        logger.error(err);
        res.status(500).send('Server Error');
    }
});

adminRouter.post('/editPermission/:id', Verify, VerifyRole(), async (req, res) => {
    try {
        const { name, displayName, attachedURL, requestType } = req.body;
        const updatedPermission = await Permissions.findByIdAndUpdate(req.params.id, {
            name,
            displayName,
            attachedURL,
            requestType
        }, { runValidators: true });

        if (!updatedPermission) {
            req.session.failMessage = 'Permission not found.';
            return res.redirect('/admin/dashboard/permissions');
        }
        dblogger.db(`Permission ${updatedPermission.name} updated by user ${req.user.username}.`);

        req.session.successMessage = 'Permission updated successfully.';
        res.redirect('/admin/dashboard/permissions');
    } catch (err) {
        logger.error(err);
        req.session.failMessage = 'Error updating permission. Please try again.';
        res.redirect(`/admin/editPermission/${req.params.id}`);
    }
});
adminRouter.delete('/deletePermission/:permId', Verify, VerifyRole(), async (req, res) => {
    try {
        const permId = req.params.permId;
        const permission = await Permissions.findById(permId);
        if (!permission) {
            req.session.failMessage = 'Permission not found.';
            return res.status(404).send('Permission not found.');
        }

        // Check if the permission is assigned to any role
        const roleCount = await Role.countDocuments({ permissions: permission.name });
        if (roleCount > 0) {
            req.session.failMessage = 'Cannot delete permission. It is assigned to one or more roles.';
            return res.status(400).send('Cannot delete permission. It is assigned to one or more roles.');
        }

       // await Permissions.findByIdAndDelete(permId);
        dblogger.db(`Permission ${permission.name} deleted by user ${req.user.username}.`);
        req.session.successMessage = 'Permission successfully deleted.';
        res.status(200).send('Permission deleted.');
    } catch (err) {
        logger.error("Err:" + err.toString());
        res.status(500).send('Server Error');
    }
});








adminRouter.get("/newUser",Verify,VerifyRole(), async (req, res) => {
    const roles = await Role.find();
    const userrole = req.user?.role.permissions; // Safe check for req.user
    res.render("admin/newUser", {
        rolePermissons: userrole,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        roleList: roles,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.successMessage = null;
    req.session.formData = null;
    req.session.failMessage = null;
});
adminRouter.post(
    "/newUser", 
    Verify,
    VerifyRole(),
    Validate,
    Register,  (req, res) => {
        dblogger.db(`User ${req.body.username} created by user ${req.user.username}.`);
    }
);



// CARD DASHBOARD ROUTES
adminRouter.get("/newCard",Verify,VerifyRole(), async (req, res) => {
    const userrole = req.user?.role.permissions; // Safe check for req.user
    const permissionList = await Permissions.find();
    res.render("admin/newCard", {
        permissionList: permissionList,
        rolePermissons: userrole,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.successMessage = null;
    req.session.formData = null;
    req.session.failMessage = null;
});

adminRouter.get("/dashboard/cards", Verify, VerifyRole(), async (req, res) => {
    const cards = await DashCards.find();
    const rolePermissons = req.user.role.permissions; // Safe check for req.user

    res.render("admin/carddash", {

        rolePermissons: rolePermissons,
        cards: cards,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null; // Clear the fail message after rendering
    req.session.successMessage = null; // Clear the success message after rendering

});
adminRouter.get('/editCard/:id',Verify,VerifyRole(), async (req, res) => {
    try {
        const permissionList = await Permissions.find();
        const card = await DashCards.findById(req.params.id);

        res.render('admin/editCard', {failMessage: req.session.failMessage, 
            permissionList: permissionList,
            formData: card,
            failMessage: req.session.failMessage,
            rolePermissons: req.user.role.permissions,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null; // Clear the fail message after rendering
        req.session.successMessage = null; // Clear the success message after rendering

    } catch (err) {
        logger.error(err);
        res.status(500).send('Server Error');
    }
});
adminRouter.post('/newCard', Verify, VerifyRole(), async (req, res) => {
  try {
    const newCard = new DashCards(req.body);

    await newCard.save();
    dblogger.db(`Card ${newCard.title} created by user ${req.user.username}.`);
    req.session.successMessage = 'Card added successfully!';
    res.redirect('/admin/dashboard/cards');

    
  } catch (err) {
    console.error(err);

    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';

    return res.render('admin/newCard', {
        permissionList: await Permissions.find(),
      formData: req.body,
      successMessage: null,
      failMessage: errorMessage,
      card: { ...req.body, _id: req.params.id },
        user: req.user
    });
    
  }
});

adminRouter.post('/editCard/:id', Verify, VerifyRole(), async (req, res) => {
  try {
    await DashCards.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
    dblogger.db(`Card ${req.body.title} updated by user ${req.user.username}.`);
    req.session.successMessage = 'Card modified successfully!';
    res.redirect('/admin/dashboard/cards');

  } catch (err) {
    console.error(err);

    const errorMessage = err.errors
      ? Object.values(err.errors).map(e => e.message).join(' ')
      : 'Server error';

    return res.render('admin/editCard', {
        permissionList: await Permissions.find(),
      formData: req.body,
      successMessage: null,
      failMessage: errorMessage,
      card: { ...req.body, _id: req.params.id },
        user: req.user
    });
  }
});





adminRouter.delete('/deleteCard/:cardId', Verify,VerifyRole(), async (req, res) => {
    try {
        const CardId = req.params.cardId;
        await DashCards.findByIdAndDelete(CardId);
        dblogger.db(`Card ${CardId} deleted by user ${req.user.username}.`);
        req.session.successMessage = 'Card successfully deleted.';
        res.status(200).send('Card deleted.');
    } catch (err) {
        logger.error("Err:" +err.toString());
        res.status(500).send('Server Error');
    }
    
});

export default adminRouter;