import express from "express";
import mongoose from "mongoose";
const app=express()
import User from "./models/user.js";
import cors from "cors"
import dotenv from "dotenv"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
app.use(cors({
    origin: '*', // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow these HTTP methods
    allowedHeaders: ['Content-Type'], 
  }));
  
  app.use(express.json());
  dotenv.config();
const response=mongoose.connect(process.env.URL,{
    useNewUrlParser: true,
      useUnifiedTopology: true,
});
if(response)
{
    console.log("Connected to DB");

}
else{
    console.log("Not connected")
}
app.get('/',(req,res)=>{
    res.send('hello')
})


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
    }
  
    try {
        const user = await User.findOne({ email });
  
        if (!user) {
            return res.status(401).json({ success: false, message: "User does not exist." });
        }
  
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password." });
        }
  
        // Use 'userId' in the payload to make sure it aligns with the registration token format
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        user.token = token; 
        await user.save();

        res.status(200).json({ success: true, message: "Login successful!", token, user });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error. Please try again later." });
    }
  });
  

  app.post('/register', async (req, res) => {
    const { email, password,name } = req.body;

    // Validate input
    if ( !email || !password || !name) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

   
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            
        });

        // Save user
        const savedUser = await newUser.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: savedUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return success response with token and user info
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
});

app.post('/addcart/:userId', async (req, res) => {
    const { userId } = req.params;
    const { cart } = req.body;
  
    try {
      await User.findByIdAndUpdate(userId, { cart }, { new: true });
      res.status(200).send('Cart updated successfully');
    } catch (err) {
      console.error('Error updating cart:', err);
      res.status(500).send('Error updating cart');
    }
  });

  app.post('/addwish/:userId',async(req,res)=>{
    const{userId}=req.params;
    const {wishlist}=req.body;
    try{
        await User.findByIdAndUpdate(userId,{wishlist},{new:true})
       return res.status(200).json({message:'wish updated successfully'});
    }
    catch(err)
    {
        console.error(err);
        return res.status(200).json({message:"Error adding wish"})
    }
  })

  app.get('/getwish/:userId', async (req, res) => {
    try {
      const {userId}=req.params
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({ wish: user.wishlist }); // Assuming 'cart' is a field in your user model
    } catch (err) {
      console.error('Error fetching wish:', err);
      res.status(500).send('Error fetching wish');
    }
  });
  
  app.get('/getcart/:userId', async (req, res) => {
    try {
      const {userId}=req.params
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({ cart: user.cart }); // Assuming 'cart' is a field in your user model
    } catch (err) {
      console.error('Error fetching cart:', err);
      res.status(500).send('Error fetching cart');
    }
  });
  

  app.delete('/delete-wish-item/:userId', async (req, res) => {
    const { userId } = req.params;
    const { itemId } = req.body; // Get the item ID from the request body
  
    try {
        // Update the user's wishlist by pulling (removing) the item with the specified ID
        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { wishlist: { id: itemId } } }, // Assuming each item has a unique 'id' property
            { new: true } // Return the updated document
        );
  
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
  
        res.status(200).json({ message: 'Item deleted successfully', wishlist: user.wishlist });
    } catch (err) {
        console.error('Error deleting item from wishlist:', err);
        res.status(500).send('Internal server error');
    }
  });


  app.delete('/delete-cart-item/:userId', async (req, res) => {
    const { userId } = req.params;
    const { itemId } = req.body; // Get the item ID from the request body
  
    try {
        // Update the user's cart by pulling (removing) the item with the specified ID
        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { cart: { id: itemId } } }, // Assuming each item has a unique 'id' property
            { new: true } // Return the updated document
        );
  
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
  
        res.status(200).json({ message: 'Item deleted successfully', cart: user.cart });
    } catch (err) {
        console.error('Error deleting item from cart:', err);
        res.status(500).send('Internal server error');
    }
  });
  
app.listen(process.env.PORT,(req,res)=>{
    console.log("Server started...")
})