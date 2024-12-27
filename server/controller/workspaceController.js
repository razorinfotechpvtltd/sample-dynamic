const workSpace = require('../models/workspaceModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { trusted } = require('mongoose');


exports.registerForTrial = async (req, res) => {
    const { name, phoneNumber, domainName, email, password } = req.body;

    try {
        // Check if the email already exists
        const existingUser = await workSpace.findOne({ email });

        if (existingUser) {
            if (existingUser.isOtpVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already registered for a workSpace.',
                });
            } 
        }

        // Check if the domainName is already taken
        const existingDomain = await workSpace.findOne({ domainName,isDomainVerified:true });

        if (existingDomain) {
            return res.status(400).json({
                success: false,
                message: 'Domain name is already in use. Please choose a different domain name.',
            });
        }

        // Hash the password
        const saltRounds = 10; // Number of salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate OTP and its expiration time
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        // Create a trial entry with OTP and hashed password
        const newworkSpace = new workSpace({
            name,
            phoneNumber,
            domainName,
            email,
            password: hashedPassword, // Store the hashed password
            otp,
            otpExpiresAt,
        });
        await newworkSpace.save();

        // Send OTP to email
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Replace with your email service
            auth: {
                user: process.env.EMAIL_USER, // Replace with your email
                pass: process.env.EMAIL_PASS, // Replace with your email password
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Trial Registration',
            text: `Your OTP for the 7-day trial registration is: ${otp}. This OTP is valid for 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            success: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
        });
    } catch (error) {
        console.error('Error registering for trial:', error.message);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred while registering for the workSpace.',
            error: error.message,
        });
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Find the user by email
        const trialUser = await workSpace.findOne({ email });

        if (!trialUser) {
            return res.status(404).json({
                success: false,
                message: 'No registration found for the provided email.',
            });
        }

        // Check if OTP matches and is not expired
        if (trialUser.otp !== Number(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP.',
            });
        }

        if (Date.now() > trialUser.otpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP.',
            });
        }

        // Mark OTP as verified
        trialUser.isOtpVerified = true;
        trialUser.otp = null; // Clear the OTP
        trialUser.otpExpiresAt = null; // Clear the expiration time
        trialUser.isVerifiedUser = true; // Clear the expiration time
        trialUser.isDomainVerified = true; // Clear the expiration time
        trialUser.databaseName = `workspaceDB_${trialUser.domainName}`; // Clear the expiration time

        await trialUser.save();



        // Send login details to user's email
        const transporter = nodemailer.createTransport({
            service: 'Gmail', // or any other email service you use
            auth: {
                user: process.env.EMAIL_USER, // Replace with your email
                pass: process.env.EMAIL_PASS, // Replace with your email password
            },
        });

        const mailOptions = {
            from: 'your-email@example.com',
            to: trialUser.email,
            subject: 'Registration Completed - Login Details',
            html: `
                <p>Dear ${trialUser.name},</p>
                <p>Your registration has been successfully completed.</p>
                <p>Below are your login details:</p>
                <ul>
                <li><strong>Name:</strong> ${trialUser.name}</li>
                    <li><strong>Email:</strong> ${trialUser.email}</li>
                    <li><strong>Your Domain Name:</strong> ${trialUser.domainName}</li>
                    <li><strong>Login URL:</strong> <a href="https://${trialUser.domainName}.hcmaximizer.com">${trialUser.domainName}.hcmaximizer.com</a></li>
                </ul>
                <p>Please keep these details safe and do not share them with anyone.</p>
                <p>Thank you for registering!</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: 'Registration completed. Login details have been sent to your email. Kindly login for the workSpace.',
           userAccount:[
            trialUser.name,
            trialUser.email,
            trialUser.domainName
           ]
        });
    } catch (error) {
        console.error('Error verifying OTP:', error.message);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred while verifying the OTP.',
            error: error.message,
        });
    }
};

exports.resendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the email exists in the database
        const existingUser = await workSpace.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Email not found. Please register first.',
            });
        }

        if (existingUser.isOtpVerified===true) {
            return res.status(404).json({
                success: false,
                message: 'Already Verified',
            });
        }

        // Generate a new OTP and update expiration time
        const newOtp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        existingUser.otp = newOtp;
        existingUser.otpExpiresAt = otpExpiresAt;
        await existingUser.save();

        // Send OTP to email
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Replace with your email service
            auth: {
                user: process.env.EMAIL_USER, // Replace with your email
                pass: process.env.EMAIL_PASS, // Replace with your email password
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Trial Registration (Resend)',
            text: `Your new OTP for the 7-day trial registration is: ${newOtp}. This OTP is valid for 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: 'A new OTP has been sent to your email. Please verify to complete registration.',
        });
    } catch (error) {
        console.error('Error resending OTP:', error.message);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred while resending the OTP.',
            error: error.message,
        });
    }
};

exports.register = async (req, res) => {
    const { name, email, password, phoneNumber, domainName } = req.body;

    if (!name || !email || !password || !phoneNumber || !domainName) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Check if the user already exists
        const existingUser = await workSpace.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new workSpace({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phoneNumber,
            domainName,
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal Server Error.' });
    }



};





exports.login = async (req, res) => {
    const subdomain = req.subdomain; // Extract subdomain from middleware
    const { email, password } = req.body;

    // Validate subdomain
    if (!subdomain) {
        return res.status(400).json({
            success: false,
            message: 'Subdomain not found.',
            data: null,
        });
    }

    // Validate input
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required.',
            data: null,
        });
    }

    try {
        // Find user based on email and subdomain
        const user = await workSpace.findOne({ email: email.toLowerCase(), domainName: subdomain });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: null,
            });
        }

        if(!user.isVerifiedUser===true && !user.isOtpVerified===true){
            return res.status(401).json({
                success: false,
                message: 'User Is Not Verified',
                data: null,
            });
        }

      

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.',
                data: null,
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, domainName: user.domainName },
            process.env.JWT_SECRET, // Use a secure secret
            { expiresIn: '1h' }
        );

     

        // Send response
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            workspaceToken: token,
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.',
            data: null,
        });
    }
};


exports.getDashboard = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided.',
            data: null,
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user data from the database
        const user = await workSpace.findById(decoded.id).select("-_id -status");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
                data: null,
            });
        }

        // Return user-specific dashboard data
        return res.status(200).json({
            success: true,
            message: 'Dashboard data retrieved successfully.',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                domainName: `${user.domainName}.${process.env.DOMAIN_NAME}`,
                status: user.status,
            },
        });
    } catch (error) {
        console.error('Error in dashboard API:', error);
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid or expired token.',
            data: null,
        });
    }
};