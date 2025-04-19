import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import ConnectionRequest from "../models/connections.model.js";
import Comment from "../models/comments.model.js";
import Post from "../models/posts.model.js";

import bcrypt from "bcrypt";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";


const convertUserDataTOPDF = async (userData) => {
    const doc = new PDFDocument();
    const outputPath = crypto.randomBytes(32).toString("hex") + ".pdf";
    const stream = fs.createWriteStream("uploads/" + outputPath);

    doc.pipe(stream);

    
    doc.fontSize(20).text('Profile Resume', { align: 'center', underline: true });
    doc.moveDown(1); 

    
    doc.image(`uploads/${userData.userId.profilePicture}`, { 
        align: "center", 
        width: 100,
        height: 100, 
    });
    doc.moveDown(5.5); 

    
    doc.fontSize(14).text(`Name: ${userData.userId.name}`, { paragraphGap: 10 });
    doc.fontSize(14).text(`Username: @${userData.userId.username}`, { paragraphGap: 10 });
    doc.fontSize(14).text(`Email: ${userData.userId.email}`, { paragraphGap: 10 });
    doc.moveDown(0.5); // Space before bio

    
    doc.fontSize(14).text('Bio:', { paragraphGap: 5, continued: false });
    doc.fontSize(12).text(userData.bio, { 
        width: 400, 
        align: 'left',
        indent: 20, 
        paragraphGap: 10,
    });
    doc.moveDown(0.5);

    
    doc.fontSize(14).text(`Current Position: ${userData.currentPost || 'Not specified'}`, { paragraphGap: 10 });
    doc.moveDown(1); 

   
    doc.fontSize(16).text('Work History:', { underline: true });
    doc.moveDown(0.5);

    userData.pastWork.forEach((work, index) => {
        doc.fontSize(14).text(`Company: ${work.company}`, { paragraphGap: 5 });
        doc.fontSize(14).text(`Position: ${work.position}`, { paragraphGap: 5 });
        doc.fontSize(14).text(`Years: ${work.years}`, { paragraphGap: 10 });
        
       
        if (index < userData.pastWork.length - 1) {
            doc.moveDown(0.3);
            doc.strokeColor('#cccccc').lineWidth(1)
                 .moveTo(50, doc.y)
                 .lineTo(550, doc.y)
                 .stroke();
            doc.moveDown(0.7);
        }
    });

    doc.end();
    return outputPath;
};


export const register = async (req, res) => {
    try {
        const { name, email, password, username} = req.body;

        if (!name || !email || !password || !username) return res.status(400).json({ message: "All fields are required" });

        const user = await User.findOne({ email });

        if (user) return res.status(400).json({ message: "User already exists" });
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            username
        });

        await newUser.save();

        const profile = new Profile({ userId: newUser._id });

        await profile.save();

        return res.json({ message: "User Created"});

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const login = async (req, res) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ message: "All fields are required" });

        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "User does not exist" });

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = crypto.randomBytes(32).toString("hex");

        await User.updateOne({ _id: user._id }, { token });

        return res.json({ token: token });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const uploadProfilePicture = async (req, res) => {
    const { token } = req.body;

    try {
        const user = await User.findOne({ token: token }); 

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.profilePicture = req.file.filename;

        await user.save();

        return res.json({ message: "Profile Picture Updated" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const updateUserProfile = async (req, res) => {

    try {

        const { token, ...newUserData } = req.body;

        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { username, email } = newUserData;

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
            if (existingUser || String(existingUser._id) !== String(user._id)) {
                return res.status(400).json({ message: "User already exists" });
            }
        }

        Object.assign(user, newUserData);

        await user.save();

        return res.json({ message: "User Updated" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const getUserAndProfile = async (req, res) => {

    try {

        const { token } = req.query;

        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userProfile = await Profile.findOne({ userId: user._id }).populate("userId", "name email username profilePicture");

        return res.json(userProfile);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const updateProfileData = async (req, res) => {
    try {

        const { token, ...newProfileData } = req.body;

        const userProfile = await User.findOne({ token: token });

        if(!userProfile) {
            return res.status(404).json({ message: "User not found" });
        }

        const profile_to_update = await Profile.findOne({ userId: userProfile._id });

        Object.assign(profile_to_update, newProfileData);

        await profile_to_update.save();

        return res.json({ message: "Profile Updated" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


export const getAllUserProfile = async (req, res) => {

    try {

        const profiles = await Profile.find().populate('userId', 'name username email profilePicture');

        return res.json({ profiles });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const downloadProfile = async (req, res) => {

    try {

        const user_id = req.query.id;

        const userProfile = await Profile.findOne({ userId: user_id }).populate("userId", "name username email profilePicture");

        let outputPath = await convertUserDataTOPDF(userProfile);

        return res.json({ "message": outputPath });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const sendConnectionRequest = async (req, res) => {

    const { token, connectionId } = req.body;

    try {

        const user = await User.findOne({ token });

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connectionUser = await User.findOne({ _id: connectionId });

        if(!connectionUser) {
            return res.status(404).json({ message: "Connection User not found" });
        }

        const existingRequest = await ConnectionRequest.findOne(
            {
                userId: user._id,
                connectionId: connectionUser._id
            }
        )

        if(existingRequest) {
            return res.status(400).json({ message: "Request already sent" });
        }

        const request = new ConnectionRequest({
            userId: user._id,
            connectionId: connectionUser._id
        });

        await request.save();

        return res.json({ message: "Request sent" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};


export const getMyConnectionsRequests = async (req, res) => {

    const { token } = req.query;

    try {

        const user = await User.findOne({ token });

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connections = await ConnectionRequest.find({ userId: user._id }).populate("connectionId", "name username email profilePicture");

        return res.json({ connections });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const whatAreMyConnections = async (req, res) => {

    const { token } = req.query;

    try {

        const user = await User.findOne({ token });

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connections = await ConnectionRequest.find({ connectionId: user._id }).populate("userId", "name username email profilePicture");

        return res.json(connections);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const acceptConnectionRequest = async (req, res) => {

    const { token, requestId, action_type } = req.body;

    try {

        const user = await User.findOne({ token });

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connection = await ConnectionRequest.findOne({ _id: requestId });

        if(!connection) {
            return res.status(404).json({ message: "Connection not found" });
        }

        if (action_type === "accept") {
            connection.status_accepted = "true";
        } else {
            connection.status_accepted = "false";
        }

        await connection.save();

        return res.json({ message: "Request updated" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};


export const commentPost = async (req, res) => {

    const { token, post_id, commentBody } = req.body;

    try {
        
        const user = await User.findOne({ token: token }).select('_id');

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const post = await Post.findOne({
            _id: post_id
        });

        if(!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = new Comment({
            userId: user._id,
            postId: post_id,
            body: commentBody
        });

        await comment.save();

        return res.status(200).json({ message: "Comment added" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


export const getUserProfileAndUserBasedOnUsername = async (req, res) => {

    const { username } = req.query;

    try {

        const user = await User.findOne({ username });

        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userProfile = await Profile.findOne({ userId: user._id })
            .populate("userId", "name email username profilePicture");

        return res.json({ "profile": userProfile });    

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};