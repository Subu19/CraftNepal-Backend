import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Guide from './models/Guide';

dotenv.config();

const uri = process.env.URI || '';

async function check() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB...");

        const guides = await Guide.find({});
        console.log("Found guides:", guides.length);
        guides.forEach(g => {
            console.log(`- ID: ${g.id}, Header: ${g.header}`);
        });

        mongoose.connection.close();
    } catch (error) {
        console.error("Error:", error);
    }
}

check();
