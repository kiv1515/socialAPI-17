// src/utils/seed.ts
import connection from '../config/connection.js';
import { User } from '../models/User.js';
import { Thought } from '../models/Thought.js';

// Start the seeding runtime timer
console.time('seeding');

// Sample data
const users = [
    {
        username: 'lernantino',
        email: 'lernantino@gmail.com',
    },
    {
        username: 'johndoe',
        email: 'john@email.com',
    },
    {
        username: 'janedoe',
        email: 'jane@email.com',
    },
];

const thoughts = [
    {
        thoughtText: 'Here is a cool thought...',
        username: 'lernantino',
    },
    {
        thoughtText: 'Learning Node.js is fun!',
        username: 'johndoe',
    },
    {
        thoughtText: 'MongoDB is great for social networks',
        username: 'janedoe',
    },
];

// Creates a connection to mongodb
connection.once('open', async () => {
    console.log('Connected to the database.');

    try {
        // Clean the database
        await User.deleteMany({});
        await Thought.deleteMany({});
        console.log('Database cleaned');

        // Create users
        const createdUsers = await User.insertMany(users);
        console.log('Users seeded');

        // Create thoughts and associate them with users
        const thoughtPromises = thoughts.map(async (thought) => {
            const user = createdUsers.find(u => u.username === thought.username);
            if (user) {
                const newThought = await Thought.create({
                    ...thought,
                    reactions: [
                        {
                            reactionBody: 'Great thought!',
                            username: createdUsers.find(u => u.username !== thought.username)?.username,
                        },
                    ],
                });

                // Add thought to user's thoughts array
                await User.findByIdAndUpdate(
                    user._id,
                    { $push: { thoughts: newThought._id } }
                );

                return newThought;
            }
        });

        // Add friends between users
        await Promise.all(createdUsers.map(async (user) => {
            // Add other users as friends
            const friendIds = createdUsers
                .filter(u => u._id !== user._id)
                .map(u => u._id);
            
            await User.findByIdAndUpdate(
                user._id,
                { $push: { friends: { $each: friendIds } } }
            );
        }));

        await Promise.all(thoughtPromises);
        console.log('Thoughts and reactions seeded');
        console.log('Friends connections seeded');

        console.timeEnd('seeding complete 🌱');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
});