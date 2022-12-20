const asyncHandler = require("express-async-handler");
const User = require('../models/userModel')
const generateToken = require("../config/generateToken");

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, pic } = req.body;
    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please Enter all the fields")
    }
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error("User already exists. Please try some other email id");
    }

    const user = await User.create({
        name,
        email,
        password,
        pic,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error("Failed to Create the User")
    }
});

const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            pic: user.pic,
            token: generateToken(user._id)
        });
    } else {
        res.status(401);
        throw new Error("Invalid Email or Password");
    }
});

//api/user?search=
const searchUsers = asyncHandler(async (req, res) => {
    var pattern = "^" + req.query.search;
    
    const keyword = req.query.search ? {
        "$or": [
            { name: { $regex: pattern, $options: "i" } },
            { email: { $regex: pattern, $options: "i" } },
        ],
    }
        : {};   
    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });    
    res.send(users);
});

module.exports = { registerUser, authUser, searchUsers };