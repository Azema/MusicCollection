'use strict';

/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
	if (!req.isAuthenticated()) {
		return res.send(401, 'User is not authorized');
	}
	next();
};

/* vim: set ts=2 sw=2 et ai: */
