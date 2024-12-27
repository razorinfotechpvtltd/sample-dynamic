const path = require('path');
const { connectSubdomainDB } = require('../config/database');
const workSpace = require('../models/workspaceModel');

exports.workspaceDomain = async (req, res, next) => {
    const host = req.headers.host; // Example: api.hcmaximizer.com
    const domain = process.env.DOMAIN_NAME || 'hcmaximizer.com'; // Main domain
    let subdomain = '';

    // Extract the subdomain
    if (host && domain && host.endsWith(domain)) {
        const parts = host.split('.');
        if (parts.length > 2) {
            subdomain = parts.slice(0, -2).join('.').toLowerCase(); // Normalize to lowercase
        }
    }

    req.subdomain = subdomain;

    // Handle reserved or undefined subdomains
    if (subdomain === 'api') {
        return next(); // Allow access to API
    } else if (!subdomain || subdomain === 'www') {
        return res.status(404).sendFile(path.join(__dirname, '../public', '404.html'));
    }

    try {
        // Check if the subdomain exists in the main database
        const tenant = await workSpace.findOne({ domainName: subdomain, status: 'active' });
        if (tenant) {
            // Check if the user is verified and OTP is verified
            if (!tenant.isVerifiedUser || !tenant.isOtpVerified) {
                return res.status(404).sendFile(path.join(__dirname, '../public', '404.html'));
            }

            req.tenant = tenant;
            req.dbConnection = connectSubdomainDB(subdomain); // Connect to the subdomain database

            // Check if it's a browser request
            const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
            if (acceptsHtml) {
                return res.sendFile(path.join(__dirname, '../public', 'login.html'));
            } else {
                return next(); // Proceed to API routes for non-HTML requests
            }
        } else {
            // Serve custom 404.html for inactive or non-existent subdomains
            return res.status(404).sendFile(path.join(__dirname, '../public', '404.html'));
        }
    } catch (err) {
        console.error('Error in workspaceDomain middleware:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.',
        });
    }
};
