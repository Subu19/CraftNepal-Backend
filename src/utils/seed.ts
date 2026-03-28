import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import Guide from './models/Guide';
import Post from './models/Post';
import Comment from './models/Comment';

dotenv.config();

const uri = process.env.URI || '';

async function seed() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing data (optional, but good for test data)
        // await User.deleteMany({});
        // await Guide.deleteMany({});
        // await Post.deleteMany({});
        // await Comment.deleteMany({});

        // 1. Add some random players (Users)
        const users = [
            {
                discordId: '123456789012345678',
                discordTag: 'CraftMaster#0001',
                username: 'CraftMaster',
                avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
                isAdmin: true
            },
            {
                discordId: '876543210987654321',
                discordTag: 'NepalExplorer#1234',
                username: 'NepalExplorer',
                avatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
                isAdmin: false
            },
            {
                discordId: '112233445566778899',
                discordTag: 'BuilderPro#9999',
                username: 'BuilderPro',
                avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
                isAdmin: false
            }
        ];

        for (const userData of users) {
            await User.findOneAndUpdate({ discordId: userData.discordId }, userData, { upsert: true, new: true });
        }
        console.log("Seed: Users added.");

        // 2. Add Guides
        const guidesToSeed = [
            {
                id: 'Rules',
                header: 'CraftNepal Official Server Rules',
                data: [
                    { title: 'Community Conduct', text: 'Be respectful to all members. Discrimination, hate speech, or harassment is strictly prohibited.' },
                    { title: 'Gameplay Integrity', text: 'No Griefing: Do not steal, destroy, or modify any items belonging to other players. No Cheating: The use of any external software/hacks is a permanent ban offense.' },
                    { title: 'Land Claiming', text: 'Claim your land using the Golden Shovel to protect your builds.' }
                ]
            },
            {
                id: 'Commands',
                header: 'Server Command Reference',
                data: [
                    { title: 'General Commands', text: '/spawn - Return to the main hub\n/rtp - Teleport to a random location\n/sethome - Save your current location' },
                    { title: 'Economy Commands', text: '/pay <player> <amount> - Transfer money\n/baltop - Shows the richest players' },
                    { title: 'Teleportation', text: '/tpa <player> - Request to teleport to a friend\n/warp <name> - Go to a public warp' }
                ]
            },
            {
                id: 'Ranks',
                header: 'Server Ranks and Perks',
                data: [
                    { title: 'Member', text: 'Basic rank for joining. Access to 1 home, /kit member.' },
                    { title: 'VIP', text: 'Support the server! Access to 5 homes, /back on death, /nick.' },
                    { title: 'Legend', text: 'Exclusive perks! Access to 20 homes, /fly in claims, /hat.' }
                ]
            },
            {
                id: 'Market',
                header: 'Trading and Economy',
                data: [
                    { title: 'Global Shop', text: 'Use /shop to buy and sell items directly to the server.' },
                    { title: 'Player Shops', text: 'Visit /warp market to browse stalls created by other players.' },
                    { title: 'Auction House', text: 'Use /ah to list items for sale globally.' }
                ]
            },
            {
                id: 'Others',
                header: 'Miscellaneous Information',
                data: [
                    { title: 'Resource World', text: 'Use /warp resource for gathering materials. This world resets every week!' },
                    { title: 'Events', text: 'We host weekly building competitions and PvP tournaments. Check /discord for announcements!' }
                ]
            },
            {
                id: 'FAQ',
                header: 'Frequently Asked Questions',
                data: [
                    { title: 'How do I claim land?', text: 'Get a golden shovel and right-click two corners of your area.' },
                    { title: 'How do I earn money?', text: 'Kill mobs, sell items in /shop, or win events!' },
                    { title: 'How do I contact staff?', text: 'Use /report in-game or open a ticket on our Discord server.' }
                ]
            }
        ];

        for (const guideData of guidesToSeed) {
            await Guide.findOneAndUpdate({ id: guideData.id }, guideData, { upsert: true });
        }
        console.log("Seed: All Guides added with Capitalized IDs.");

        // 3. Add some Posts
        const posts = [
            {
                id: 1,
                caption: 'Check out my new mountain base! #CraftNepal #Building',
                author: {
                    username: 'BuilderPro',
                    profilePic: 'https://cdn.discordapp.com/embed/avatars/2.png',
                    id: '112233445566778899'
                },
                likes: [
                    { username: 'CraftMaster', userId: '123456789012345678', profilePic: 'https://cdn.discordapp.com/embed/avatars/0.png' }
                ],
                createdAt: new Date()
            },
            {
                id: 2,
                caption: 'Just found a massive cave system near spawn!',
                author: {
                    username: 'NepalExplorer',
                    profilePic: 'https://cdn.discordapp.com/embed/avatars/1.png',
                    id: '876543210987654321'
                },
                likes: [],
                createdAt: new Date(Date.now() - 3600000)
            },
            {
                id: 3,
                caption: 'Finally finished the automatic sorting system! Efficiency 100.',
                author: {
                    username: 'CraftMaster',
                    profilePic: 'https://cdn.discordapp.com/embed/avatars/0.png',
                    id: '123456789012345678'
                },
                likes: [
                    { username: 'BuilderPro', userId: '112233445566778899', profilePic: 'https://cdn.discordapp.com/embed/avatars/2.png' }
                ],
                createdAt: new Date(Date.now() - 7200000)
            }
        ];

        for (const postData of posts) {
            const post = await Post.findOneAndUpdate({ id: postData.id }, postData, { upsert: true, new: true });

            // Add a comment to each post if it doesn't have any
            if (post && post.comments.length === 0) {
                const comments = postData.id === 1 ? [
                    {
                        id: Math.floor(Math.random() * 10000),
                        username: 'NepalExplorer',
                        profilePic: 'https://cdn.discordapp.com/embed/avatars/1.png',
                        discordId: '876543210987654321',
                        comment: 'Wow, that base looks amazing! Can I join?',
                        likes: [],
                        isReply: false
                    },
                    {
                        id: Math.floor(Math.random() * 10000),
                        username: 'CraftMaster',
                        profilePic: 'https://cdn.discordapp.com/embed/avatars/0.png',
                        discordId: '123456789012345678',
                        comment: 'Great work! Let me know if you need help with the interior.',
                        likes: [],
                        isReply: false
                    }
                ] : [
                    {
                        id: Math.floor(Math.random() * 10000),
                        username: 'BuilderPro',
                        profilePic: 'https://cdn.discordapp.com/embed/avatars/2.png',
                        discordId: '112233445566778899',
                        comment: postData.id === 2 ? 'I am coming there right now! Coordinate please?' : 'Teach me how to build this!',
                        likes: [],
                        isReply: false
                    }
                ];

                for (const c of comments) {
                    const commentData = new Comment(c);
                    await commentData.save();
                    post.comments.push(commentData._id);
                }
                await post.save();
            }
        }
        console.log("Seed: Comments added and linked to posts.");

        console.log("Seeding completed successfully!");
        mongoose.connection.close();
    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
}

seed();
