require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Article = require('./models/Article');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//######################################### DATABASE CONNECTION #########################################

async function main() {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Database Connected Succefully!");
}
main().catch(err => console.log(err));

//######################################### ROUTES #########################################

// 1. Signup 
app.post("/api/signup", async function (req,res) {

    const { email, password, name, age } = req.body;
    
    try {
        // Check if user with given email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Encrypt password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ email, password: hashedPassword, name, age });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } 
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }

});

// 2. Login 
app.post('/api/login', async function (req, res) {

    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email' });
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Password not matched' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY , { expiresIn: '1h' });

        res.status(200).json({ token });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }

});

// 3. Create A New Article
app.post('/api/users/:userId/articles', verifyToken, async function (req, res) {

    const { title, description } = req.body;
    const userId = req.params.userId;

    try {
        // Verify if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found with that ID' });
        }

        // Create new article
        const article = new Article({
            title,
            description,
            authorID: userId,
            authorName: user.name,
            authorAge: user.age
        });

        // Save the article to the database
        await article.save();

        res.status(201).json({
            message: 'Article created successfully',
            article
        });

    } 
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }

});

// Verify The JWT Token
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    // console.log(bearerHeader);
    if(!bearerHeader){
        return res.status(401).json({error: 'Please provide JWT token in authorization header'});
    }
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    // console.log(token);
    
    jwt.verify(token, process.env.JWT_SECRET_KEY , (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = decoded.user;
        next();
    });
}

// 4. Get All Articles
app.get('/api/articles', verifyToken, async function (req, res) {
    try {
        const articles = await Article.find();
        res.status(200).json({ articles });
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 5. Update User Profile
app.patch('/api/users/:userId', async function(req, res) {

    const { name, age } = req.body;
    const userId  = req.params.userId;

    try {

        const user = await User.findByIdAndUpdate(userId, { name, age }, { new: true }); // {new:true} becuase by default findByIdAndUpdate sends user's old data. 

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.password = undefined;
        res.status(200).json({ message: 'User profile updated successfully', user });
    } 
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get("/", function (req,res) {
    res.send("<h1 style='font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #333333; text-align: center;'>This Application do not contain any UI, test it with shared pdf and its endpoints using Postman.</h1>");
})

// Server Port 
app.listen("3000", function () {
    console.log("App running on port 3000.");
});