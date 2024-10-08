const asyncHandler = require("express-async-handler");
const User = require('../models/userModel');
const generateToken = require("../config/generateToken");

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, pic } = req.body;

    if (!name || !email || !password) {
        res.send(400);
        throw new Error('Please fill in all fields');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('Email already in use');
    }

    const user = await User.create({
        name,
        email,
        password,
        pic
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id)
        })
    } else {
        res.status(400)
        throw new Error('Failed to create the user')
    }

})



// @desc    Auth user & get token
// @route   POST /api/user/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// /api/user?search=pavan
const allUser = asyncHandler(async (req, res) => {
    const keyword = req.query.search ? {
        $or: [
            {name: {$regex: req.query.search, $options: 'i'}}, 
            // what is regex in mongodb :

            {email: {$regex: req.query.search, $options: 'i'}}
        ]
    }:{}

    // i have to sen this keyword query to mongo
    const users = await User.find(keyword)
    .find(
        {
            _id: {
                $ne: req.user._id // means  dont show the user who is logged in (current user)

            }
        }
    )


    res.send(users)
})

module.exports = {
    registerUser,
    authUser,
    allUser
}