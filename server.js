
const express = require('express');
const formidable = require('formidable');
const { Pool } = require('pg'); // Import pg for PostgreSQL
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3000;
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
const sharp = require('sharp');

// Replace 'YOUR_BOT_TOKEN_HERE' with your actual bot token from BotFather
const bot = new Telegraf('7478644585:AAH7jPlVO7DknohKbrLj5eENChYjqS98htE');
bot.start((ctx) => {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id; // This is the userId

    console.log(chatId,userId);
  
    ctx.reply('SHOP', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'SHOP',
              web_app: { url: `https://vader-ivv5.onrender.com/?userId=${chatId}&user=${userId}` }
            }
          ]
        ]
      }
    });
  });



  bot.command('location', (ctx) => {
    const chatId = ctx.chat.id;
    console.log(chatId);
  
    ctx.reply('SHOP', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'SHOP',
              web_app: { url: `https://vader-ivv5.onrender.com/index2.html` }
            }
          ]
        ]
      }
    });
  });
  // Handle /admin command
  bot.command('admin', (ctx) => {
    const chatId = ctx.chat.id;
    console.log(chatId);
  
    ctx.reply('SHOP', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'SHOP',
              web_app: { url: `https://vader-ivv5.onrender.com/admin/admin.html?userId=${chatId}` }
            }
          ]
        ]
      }
    });
  });
  
  // Start the bot
  bot.launch();
  
// Create a new instance of the TelegramBot class
// PostgreSQL connection

const client = new Pool({
    connectionString: 'postgresql://vader:sKGcV9mz86vPfJxrpUv0TD56MEFs68Yu@dpg-cr4rfdd2ng1s73e63mjg-a.oregon-postgres.render.com/vader_imss',
    ssl: { rejectUnauthorized: false }
});
client.connect();

// Middleware to handle CORS
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('./'));

// Ensure the tables exist
client.query(`
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    tx_id TEXT,
    amount REAL,
    user_id TEXT,  -- Changed from 'user'
    wallet_address TEXT
);

`, (err) => {
    if (err) {
        console.error('Error creating transactions table:', err.message);
    }
});
// Ensure the admin_users table exists
client.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
        user_id TEXT PRIMARY KEY
    )
`, (err) => {
    if (err) {
        console.error('Error creating admin_users table:', err.message);
    }
});

client.query(`
    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        longitude REAL,
        latitude REAL,
        weight REAL,
        price REAL,
        name TEXT,
        type TEXT,
        identifier TEXT UNIQUE,
        product_image BYTEA,
        location_image BYTEA,
        location TEXT
    )
`, (err) => {
    if (err) {
        console.error('Error creating products table:', err.message);
    }
});



client.query(`CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    location_name TEXT UNIQUE
)
`, (err) => {
    if (err) {
        console.error('Error creating tables:', err.message);
    }
});

app.get('/api/checkUserMembership', async (req, res) => {
    const userId = req.query.userId;
    const chatId = -1002170284387 // The ID of the chat/channel to check

    if (!userId || !chatId) {
        return res.status(400).json({ error: 'User ID and Chat ID are required' });
    }
    bot.telegram.getChat('@testgroupcaht')
    .then((chat) => {
        console.log('Chat ID:', chat.id);
    })
    .catch((error) => {
        console.error('Error fetching chat:', error.message);
    });

    try {
        // Use the getChatMember method to check if the user is a member
        const chatMember = await bot.telegram.getChatMember(chatId, userId);

        // Check if the status is "member", "administrator", or "creator"
        if (['member', 'administrator', 'creator'].includes(chatMember.status)) {
            return res.json({ isMember: true, status: chatMember.status });
        } else {
            return res.json({ isMember: false, status: chatMember.status });
        }
    } catch (error) {
        console.error('Error checking user membership:', error.message);
        return res.status(500).json({ error: 'Failed to check user membership' });
    }
});

app.get('/api/cities', async (req, res) => {
    try {
        // Log the start of the request
        console.log('Received request for /api/cities');

        // Fetch cities from the database
        const result = await client.query('SELECT id, city_name FROM cities'); // Adjust as needed

        // Log the fetched cities
        console.log('Fetched cities:', result.rows);

        // Respond with the cities
        res.json({ cities: result.rows });
    } catch (error) {
        // Log detailed error information
        console.error('Error fetching cities:', error.message);
        console.error('Stack trace:', error.stack);

        // Respond with a 500 status and error message
        res.status(500).json({ error: 'Failed to fetch cities' });
    }
});

app.get('/', (req, res) => {
    // Get the IP address of the client
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.send(`Your IP address is: ${ip}`);
});
app.get('/api/locations', async (req, res) => {
    try {
        // Log the start of the request
        console.log('Received request for /api/locations with cityId:', req.query.cityId);

        // Get the cityId from query parameters
        const cityId = req.query.cityId;

        if (!cityId) {
            return res.status(400).json({ error: 'City ID is required' });
        }

        // Fetch locations for the specified city from the database
        const result = await client.query(
            'SELECT id, location_name FROM locations WHERE city_id = $1',
            [cityId]
        );

        // Log the fetched locations
        console.log('Fetched locations:', result.rows);

        // Respond with the locations
        res.json({ locations: result.rows });
    } catch (error) {
        // Log detailed error information
        console.error('Error fetching locations:', error.message);
        console.error('Stack trace:', error.stack);

        // Respond with a 500 status and error message
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});
app.get('/check-transaction/', async (req, res) => {
    const { txId } = req.query;
    console.log(txId)
    try {
        const result = await client.query(
            'SELECT user_id, transaction_id, location_image, lat, lng, additional_image FROM transactions WHERE transaction_id = $1',
            [txId]
        );

        if (result.rowCount > 0) {
            const transaction = result.rows[0];
            res.json({
                exists: true,
                user_id: transaction.user_id,
                transaction_id: transaction.transaction_id,
                location_image: transaction.location_image.toString('base64'), // Convert bytea to base64 string
                lat: transaction.lat,
                lng: transaction.lng,
                additional_image: transaction.additional_image ? transaction.additional_image.toString('base64') : null // Convert bytea to base64 string if it exists
            });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking transaction:', error.message);
        res.status(500).json({ exists: false });
    }
});



app.get('/check-order/', async (req, res) => {
    const { Id } = req.query;
    console.log('hello world')
    try {
        const result = await client.query(
            'SELECT longitude, latitude, location_image, weight, name, additional_image FROM bought WHERE product_id = $1',
            [Id]
        );

        if (result.rowCount > 0) {
            const order = result.rows[0];
            res.json({
                name: order.name,
                weight: order.weight,
                exists: true,
                user_id: order.user_id,
                location_image: order.location_image.toString('base64'), // Convert bytea to base64 string
                latitude: order.latitude,
                longitude: order.longitude,
                additional_image: order.additional_image ? order.additional_image.toString('base64') : null // Convert bytea to base64 string if it exists
            });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking transaction:', error.message);
        res.status(500).json({ exists: false });
    }
});

function generateTransactionId() {
    return 'TX-' + Math.floor(Math.random() * 1000000).toString(); // Example: generate a random transaction ID
}
app.get('/promocode/:identifier/:userId', async (req, res) => {
    const identifier = req.params.identifier;
    const userChatId = req.params.userId;

    console.log(identifier);

    try {
        const result = await client.query('SELECT * FROM products WHERE identifier = $1', [identifier]);
        const row = result.rows[0];

        if (row) {
            const productDetails = {
                identifier: row.identifier,
                name: row.name,
                price: row.price,
                weight: row.weight,
                type: row.type,
                latitude: row.latitude,
                longitude: row.longitude,
                location: row.location
            };

            const locationImageBuffer = row.location_image; // Assuming `row.location_image` contains the BYTEA data

            if (locationImageBuffer) {
                // Send the image buffer to the user using Telegraf

                // Generate a random transaction ID
                const transactionId = generateTransactionId();
                console.log(userChatId,
                    row.name,
                    row.location_image,
                    row.weight, // Assuming you want to save the same image
                    row.additional_image, // Assuming additional_image is not provided
                    row.latitude,
                    row.longitude,
                    row.identifier,
                    row.identifier)

                await client.query(
                    'INSERT INTO bought (user_id, name, location_image, weight, additional_image, latitude, longitude, product_id,identifier) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                    [
                        userChatId,
                        row.name,
                        row.location_image,
                        row.weight, // Assuming you want to save the same image
                        row.additional_image, // Assuming additional_image is not provided
                        row.latitude,
                        row.longitude,
                        row.identifier,
                        row.identifier
                    ]
                );

                // Respond with product details
                res.json(productDetails);

                // Remove the product with the specified identifier
                await client.query('DELETE FROM products WHERE identifier = $1', [identifier]);
                console.log(`Product with identifier ${identifier} has been removed.`);
                
            } else {
                await bot.telegram.sendMessage(userChatId, `Product ${row.name} (${row.identifier}) found, but no location image is available.`);
                res.json(productDetails); // Still respond with product details
            }
        } else {
            res.status(404).send('Product not found.');
        }
    } catch (err) {
        console.error('Error retrieving product:', err.message);
        res.status(500).send('Error retrieving product.');
    }
});

app.post('/removeLocation', async (req, res) => {
    try {
        // Extract the location name from the request body
        const { location_name } = req.body;

        // Ensure the location name is provided
        if (!location_name) {
            return res.status(400).json({ error: 'Location name is required' });
        }

        // Query to delete the location by name (assuming a unique constraint or handling is in place)
        const result = await client.query('DELETE FROM locations WHERE location_name = $1 RETURNING *', [location_name]);

        // Check if a location was deleted
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }

        // Respond with a success message
        res.status(200).json({ message: 'Location removed successfully' });
    } catch (error) {
        // Handle any errors
        console.error('Error removing location:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/addlocation', async (req, res) => {
    const { location_name } = req.body;

    if (!location_name) {
        return res.status(400).send('Location name is required.');
    }

    try {
        await client.query('INSERT INTO locations (location_name) VALUES ($1) ON CONFLICT (location_name) DO NOTHING', [location_name]);
        res.send('Location added successfully.');
    } catch (err) {
        console.error('Error adding location:', err.message);
        res.status(500).send('Error adding location.');
    }
});

// Function to create a new wallet address
async function createWalletAddress(user_id) {
    try {
        const response = await axios.post('https://coinremitter.com/api/v3/LTC/get-new-address', {
            api_key: 'wkey_kWA4aSuFGxeNgNN',
            password: 'test2023',
            label: user_id
        });

        if (response.data.flag === 1) {
            const newAddress = response.data.data.address;
            return newAddress;
        } else {
            throw new Error('Failed to create wallet address');
        }
    } catch (error) {
        console.error('Error creating wallet address:', error.message);
        throw error;
    }
}




// Route to add or remove admin users
app.post('/admins', async (req, res) => {
    const { action, user_id } = req.body;
    console.log(action, user_id);
    if (!action || !user_id) {
        return res.status(400).send('Action and user ID are required.');
    }

    try {
        if (action === 'add') {
            // Add admin user
            await client.query('INSERT INTO admin_users (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [user_id]);
            res.send('Admin user added successfully.');
        } else if (action === 'remove') {
            // Remove admin user
            const result = await client.query('DELETE FROM admin_users WHERE user_id = $1 RETURNING *', [user_id]);

            if (result.rowCount > 0) {
                res.send('Admin user removed successfully.');
            } else {
                res.status(404).send('Admin user not found.');
            }
        } else {
            res.status(400).send('Invalid action. Use "add" or "remove".');
        }
    } catch (err) {
        console.error('Error handling admin user request:', err.message);
        res.status(500).send('Internal server error.');
    }
});

// Route to list admin users
app.get('/admins', async (req, res) => {
    try {
        const result = await client.query('SELECT user_id FROM admin_users');  // Adjust query based on your database schema
        const admins = result.rows.map(row => row.user_id);
        res.json(admins);
    } catch (err) {
        console.error('Error fetching admins:', err.message);
        res.status(500).send('Error fetching admins.');
    }
});
// Route to handle uploading product images and location images
app.post('/upload-product', upload.fields([{ name: 'productImage' }, { name: 'locationImage' },{ name: 'additionalImage' }]), async (req, res) => {
    const { latitude, longitude, weight, price, name, type, location, identifier } = req.body;
    const productImage = req.files['productImage'] ? req.files['productImage'][0].buffer : null;
    const locationImage = req.files['locationImage'] ? req.files['locationImage'][0].buffer : null;
    const additionalImage = req.files['locationImage'] ? req.files['locationImage'][0].buffer : null;

    if (!productImage || !locationImage|| !additionalImage) {
        return res.status(400).send('Both images are required.');
    }

    try {
        // Compress images using sharp
        const compressedProductImage = await sharp(productImage)
            .resize(800) // Resize if needed (optional)
            .jpeg({ quality: 40 }) // Compress and set quality (adjust as needed)
            .toBuffer();
        const compressedAdditionalImage = await sharp(additionalImage)
            .resize(800) // Resize if needed (optional)
            .jpeg({ quality: 40 }) // Compress and set quality (adjust as needed)
            .toBuffer();

        const compressedLocationImage = await sharp(locationImage)
            .resize(800) // Resize if needed (optional)
            .jpeg({ quality: 40 }) // Compress and set quality (adjust as needed)
            .toBuffer();

        await client.query(`
            INSERT INTO products (latitude, longitude, weight, price, name, type, location_id, identifier, product_image, location_image,additional_image)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [latitude, longitude, weight, price, name, type, location, identifier, compressedProductImage, compressedLocationImage,compressedAdditionalImage]);

        res.send('Product successfully uploaded.');
    } catch (err) {
        console.error('Error processing or inserting data:', err.message);
        res.status(500).send('Error saving product.');
    }
});


app.get('/api/products', async (req, res) => {
    console.log('Received request for products');

    // Get query parameters
    const location = req.query.location || '';
    const type = req.query.type || '';

    // Construct SQL query based on parameters
    let query = 'SELECT * FROM products WHERE 1=1'; // Base query
    const queryParams = [];
    
    if (location) {
        query += ' AND location_id = $1';
        queryParams.push(location);
    }
    if (type) {
        query += ' AND type = $2';
        queryParams.push(type);
    }

    // Log query for debugging
    console.log('Executing query:', query);

    try {
        // Execute the SQL query
        const result = await client.query(query, queryParams);
        
        // Retrieve rows from the query result
        let rows = result.rows;

        // Log the number of rows retrieved
        console.log('Query executed successfully. Number of rows retrieved:', rows.length);

        // Log the raw rows data
        console.log('Raw rows data:', rows);

        // Convert BLOB image data to Base64
        rows = rows.map(row => {
            if (row.product_image) {
                row.product_image = `data:image/png;base64,${Buffer.from(row.product_image).toString('base64')}`;
            } else {
                row.product_image = ''; // or null
                console.log('Product image data is missing for row:', row);
            }
            return row;
        });

        // Send response
        res.json({ products: rows });
    } catch (err) {
        console.error('Error retrieving products:', err.message);
        res.status(500).send('Error retrieving products.');
    }
});


// Route to check if a user exists and create a wallet if not
app.post('/api/check-user', async (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).send('User ID is required.');
    }

    try {
        const result = await client.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
        const row = result.rows[0];

        if (row) {
            res.json({ exists: true, walletAddress: row.wallet_address });
        } else {
            try {
                const walletAddress = await createWalletAddress(user_id);

                await client.query('INSERT INTO users (user_id, wallet_address) VALUES ($1, $2)', [user_id, walletAddress]);

                res.json({ exists: false, walletAddress });
            } catch (error) {
                console.error('Error creating wallet address:', error.message);
                res.status(500).send('Error creating wallet address.');
            }
        }
    } catch (error) {
        console.error('Error handling request:', error.message);
        res.status(500).send('Internal server error.');
    }
});

// Route to handle form submissions
app.post('/submit-product', upload.fields([{ name: 'image' }, { name: 'locationimage' }]), async (req, res) => {
    const { latitude, longitude, weight, price, name, type, location, identifier } = req.body;
    const product_image = req.files['image'][0]?.buffer;
    const location_image = req.files['locationimage'][0]?.buffer;

    if (!product_image || !location_image) {
        return res.status(400).send('Both images are required.');
    }

    try {
        // Compress images using sharp
        const compressedProductImage = await sharp(product_image)
            .resize(800) // Resize if needed (optional)
            .jpeg({ quality: 40 }) // Compress and set quality (adjust as needed)
            .toBuffer();

        const compressedLocationImage = await sharp(location_image)
            .resize(800) // Resize if needed (optional)
            .jpeg({ quality: 40 }) // Compress and set quality (adjust as needed)
            .toBuffer();

        await client.query(`
            INSERT INTO products (latitude, longitude, weight, price, name, type, location_id, identifier, product_image, location_image)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [latitude, longitude, weight, price, name, type, location, identifier, compressedProductImage, compressedLocationImage]);

        res.send('Product successfully uploaded.');
    } catch (err) {
        console.error('Error processing or inserting data:', err.message);
        res.status(500).send('Error saving product.');
    }
});




app.get('/api/checkActiveTransactions', async (req, res) => {
    try {
        const userId = req.query.userId; // Get userId from query parameters

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Query to select active transactions
        const query = 'SELECT * FROM orders WHERE user_id = $1';
        const values = [userId]; // Adjust based on your status column

        // Execute the query
        const result = await client.query(query, values);

        // Check if there are active transactions
        if (result.rows.length > 0) {
            // If there are active transactions, return the details of the first one
            const transaction = result.rows[0];
            res.json({
                hasActiveTransaction: true,
                transaction: {
                    id: transaction.id,
                    user_id: transaction.user_id,
                    price: transaction.price,
                    amount_in_ltc: transaction.amount_in_ltc,
                    wallet_address: transaction.wallet_address,
                    created_at: transaction.created_at,
                    status: transaction.status,
                    product_id: transaction.product_id
                }
            });
        } else {
            // If no active transactions, return false
            res.json({ hasActiveTransaction: false });
        }
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/create-transaction', async (req, res) => {
    const { user_id, price, amount_in_ltc, wallet_address, product_id } = req.body;

    // Validate input data
    if (!user_id || !price || !amount_in_ltc || !wallet_address || !product_id) {
        return res.status(400).send('All fields are required.');
    }

    // Convert input data to correct types
    const userIdInt = parseInt(user_id, 10);
    const priceFloat = parseFloat(price);
    const amountInLtcFloat = parseFloat(amount_in_ltc);

    try {
        // Check for existing transaction with the same user_id and product_id
        const checkQuery = `
            SELECT COUNT(*) AS count
            FROM orders
            WHERE user_id = $1
              AND product_id = $2
        `;

        const checkResult = await client.query(checkQuery, [userIdInt, product_id]);
        const count = parseInt(checkResult.rows[0].count, 10);

        if (count > 0) {
            // Existing transaction found, do nothing
            console.log('Duplicate transaction detected, no new record created.');
            return res.status(200).send('Duplicate transaction');
        }

        // Insert new transaction into the database
        const insertQuery = `
            INSERT INTO orders (user_id, price, amount_in_ltc, wallet_address, status, product_id)
            VALUES ($1, $2, $3, $4, 'pending', $5)
        `;

        await client.query(insertQuery, [userIdInt, priceFloat, amountInLtcFloat, wallet_address, product_id]);

        res.status(200).send('Transaction created successfully.');
    } catch (err) {
        console.error('Error creating transaction:', err.message);
        res.status(500).send('Error creating transaction.');
    }
});


app.get('/get-user-orders', async (req, res) => {
    const { userId } = req.query; // Extract userId from query parameters
    console.log('hit', userId);

    // Validate input
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        // Fetch all orders for the user from the bought table
        const ordersResult = await client.query(
            'SELECT * FROM bought WHERE user_id = $1',
            [userId]
        );

        // Check if any orders were found
        if (ordersResult.rowCount === 0) {
            return res.status(404).json({ message: 'No orders found for the provided user ID.' });
        }

        // Send the orders back to the client
        res.status(200).json({ orders: ordersResult.rows });
    } catch (error) {
        console.error('Error fetching user orders:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});






// Route to delete a transaction
app.post('/api/deleteTransaction', async (req, res) => {
    const { productId, userId } = req.body;

    console.log('Received delete request:', { productId, userId }); // Log incoming request

    if (!productId || !userId) {
        console.log('Product ID or User ID missing');
        return res.status(400).send('Product ID and User ID are required.');
    }

    try {
        const result = await client.query(
            'DELETE FROM orders WHERE product_id = $1 AND user_id = $2 RETURNING *',
            [productId, userId]
        );

        console.log('Delete result:', result); // Log query result

        if (result.rowCount > 0) {
            res.send('Transaction deleted successfully.');
        } else {
            res.status(404).send('Transaction not found.');
        }
    } catch (err) {
        console.error('Error deleting transaction:', err.message);
        res.status(500).send('Error deleting transaction.');
    }
});


// Route to delete a product
app.delete('/product/:identifier', async (req, res) => {
    const identifier = req.params.identifier;

    try {
        const result = await client.query('DELETE FROM products WHERE identifier = $1 RETURNING *', [identifier]);

        if (result.rowCount > 0) {
            res.send('Product successfully deleted.');
        } else {
            res.status(404).send('Product not found.');
        }
    } catch (err) {
        console.error('Error deleting product:', err.message);
        res.status(500).send('Error deleting product.');
    }
});
app.get('/api/getBalance', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).send('User ID is required');
    }

    try {
        const result = await client.query('SELECT balance FROM users WHERE user_id = $1', [userId]);
        
        if (result.rows.length > 0) {
            const balance = result.rows[0].balance;
            res.json({ balance: balance });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error fetching balance:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Route to retrieve product details
app.get('/product/:identifier', async (req, res) => {
    const identifier = req.params.identifier;

    try {
        const result = await client.query('SELECT * FROM products WHERE identifier = $1', [identifier]);
        const row = result.rows[0];

        if (row) {
            const productDetails = {
                identifier: row.identifier,
                name: row.name,
                price: row.price,
                weight: row.weight,
                type: row.type,
                latitude: row.latitude,
                longitude: row.longitude,
                location: row.location
            };
            res.json(productDetails);
        } else {
            res.status(404).send('Product not found.');
        }
    } catch (err) {
        console.error('Error retrieving product:', err.message);
        res.status(500).send('Error retrieving product.');
    }
});
app.post('/api/get-user-transactions', async (req, res) => {
    const { address, userId } = req.body;

    // Validate the input
    if (!address) {
        return res.status(400).json({ flag: 0, msg: 'Address is required.' });
    }

    try {
        // Fetch transactions from the external API
        const response = await axios.post('https://coinremitter.com/api/v3/LTC/get-transaction-by-address', {
            api_key: 'wkey_kWA4aSuFGxeNgNN',
            password: 'test2023',
            address: address
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const transactions = response.data.data;

        // Validate the response format
        if (!Array.isArray(transactions)) {
            console.error('Unexpected response format:', response.data);
            return res.status(500).json({ flag: 0, msg: 'Unexpected response format from API.' });
        }

        // Start a database transaction to update/insert the transactions
        try {
            await client.query('BEGIN');

            for (const tx of transactions) {
                const { id, amount } = tx;

                const result = await client.query('SELECT id FROM transfers WHERE tx_id = $1', [id]);

                if (result.rows.length > 0) {
                    // Update the existing transaction
                    await client.query(
                        'UPDATE transfers SET amount = $1, wallet_address = $2 WHERE tx_id = $3',
                        [amount, address, id]
                    );
                    console.log(`Transaction with tx_id ${id} updated successfully.`);
                } else {
                    // Insert a new transaction
                    await client.query(
                        'INSERT INTO transfers (tx_id, amount, user_id, wallet_address) VALUES ($1, $2, $3, $4)',
                        [id, amount, userId, address]
                    );
                    console.log(`New transaction with tx_id ${id} inserted successfully.`);
                }
            }

            await client.query('COMMIT');
            console.log('Transaction sync committed successfully.');

        } catch (dbError) {
            // Rollback the transaction in case of any errors
            await client.query('ROLLBACK');
            console.error('Database transaction failed, rolling back.', dbError.message);
            return res.status(500).json({ flag: 0, msg: 'Failed to sync transactions with the database.' });
        }

        // Respond with the original API data
        res.json(response.data);

    } catch (error) {
        // Log and respond with an error if the API request fails
        console.error('Error fetching transactions:', error.message);
        res.status(500).json({ flag: 0, msg: 'Failed to fetch transactions.' });
    }
});


async function getLtcToUsdRate() {
    const apiKey = '56f6ba30-b7cc-43f8-8e86-fbf3a1803b20'; // Replace with your API key
    try {
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=LTC', {
            headers: { 'X-CMC_PRO_API_KEY': apiKey }
        });
        return response.data.data.LTC.quote.USD.price;
    } catch (error) {
        throw new Error('Error fetching LTC to USD rate: ' + error.message);
    }
}
app.post('/webhook', (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(400).send('Error parsing form');
        }

        console.log(form, 'THIS IS FORM ------------------------');

        const address = Array.isArray(fields.address) ? fields.address[0] : fields.address;
        const amount = Array.isArray(fields.amount) ? fields.amount[0] : fields.amount;
        const type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
        const txId = Array.isArray(fields.id) ? fields.id[0] : fields.id;
        console.log(fields, 'THIS IS FIELDS ------------------------');

        console.log('Received address:', address);
        console.log('Received amount:', amount);
        console.log('Received type:', type);
        console.log('Received tx_id:', txId);

        try {
            // Query user ID from database
            const userIdResult = await client.query(
                'SELECT user_id FROM users WHERE wallet_address = $1',
                [address]
            );

            if (userIdResult.rows.length === 0) {
                console.log('No user found with the provided address.');
                return res.status(404).send('User not found');
            }

            const userId = userIdResult.rows[0].user_id;
            console.log('User ID:', userId);

            if (type === 'receive') {
                // Check if a transaction with the given tx_id exists in the transfers table
                const txCheckResult = await client.query(
                    'SELECT 1 FROM transfers WHERE tx_id = $1',
                    [txId]
                );

                if (txCheckResult.rows.length > 0) {
                    console.log('Transaction with the given tx_id already exists.');
                    return res.status(400).send('Transaction already exists');
                }

                const trimmedAddressLabel = address;
                const amountInFloat = parseFloat(amount);

                // Get LTC to USD conversion rate
                const ltcToUsdRate = await getLtcToUsdRate();
                const amountInUsd = amountInFloat * ltcToUsdRate;

                // Add the received amount to the user's balance
                await client.query(
                    'UPDATE users SET balance = balance + $1 WHERE wallet_address = $2',
                    [amountInUsd, trimmedAddressLabel]
                );
                console.log('User balance updated successfully.');

                // Record the transaction in the transfers table
                await client.query(
                    'INSERT INTO transfers (tx_id, amount, user_id, wallet_address) VALUES ($1, $2, $3, $4)',
                    [txId, amountInUsd, userId, trimmedAddressLabel]
                );
                console.log('Transaction recorded in transfers table.');

                // Check for pending orders for the user
                const ordersResult = await client.query(
                    'SELECT amount_in_ltc, product_id FROM orders WHERE wallet_address = $1',
                    [trimmedAddressLabel]
                );

                if (ordersResult.rows.length > 0) {
                    const amountInLtc = ordersResult.rows[0].amount_in_ltc;
                    const productId = ordersResult.rows[0].product_id;

                    console.log('Amount in LTC from database:', amountInLtc);

                    const acceptableDifference = 1; // $1 tolerance
                    if (amountInFloat >= amountInLtc - acceptableDifference) {
                        console.log('Transaction valid.');

                        // Deduct the amount needed for the product
                        await client.query(
                            'UPDATE users SET balance = balance - $1 WHERE wallet_address = $2',
                            [amountInLtc * ltcToUsdRate, trimmedAddressLabel]
                        );
                        console.log('User balance updated after deducting product price.');

                        // Delete the transaction from the orders table
                        await client.query('DELETE FROM orders WHERE product_id = $1 AND wallet_address = $2', [productId, trimmedAddressLabel]);
                        console.log('Transaction deleted successfully.');

                        // Fetch product information for sending to user
                        const productResult = await client.query(
                            'SELECT * FROM products WHERE identifier = $1',
                            [productId]
                        );

                        if (productResult.rows.length > 0) {
                            const row = productResult.rows[0];
                            const latitude = row.latitude;
                            const longitude = row.longitude;
                        
                            // Define file paths for the images
                            const locationImagePath = path.join(__dirname, 'location_image.jpg');
                            const additionalImagePath = path.join(__dirname, 'additional_image.jpg');
                        
                            // Handle location image
                            if (row.location_image) {
                                fs.writeFile(locationImagePath, row.location_image, 'base64', async (err) => {
                                    if (err) {
                                        console.error('Error saving location image:', err.message);
                                        return res.status(500).send('Error saving location image');
                                    }
                                    console.log('Location image saved successfully.');
                        
                                    // Handle additional image if present
                                    if (row.additional_image) {
                                        fs.writeFile(additionalImagePath, row.additional_image, 'base64', async (err) => {
                                            if (err) {
                                                console.error('Error saving additional image:', err.message);
                                                return res.status(500).send('Error saving additional image');
                                            }
                                            console.log('Additional image saved successfully.');
                        
                                            try {

                                                await client.query(
                                                    'INSERT INTO transactions (user_id, transaction_id, location_image, additional_image, lat, lng) VALUES ($1, $2, $3, $4, $5, $6)',
                                                    [userId, txId, row.location_image ,row.additional_image, row.latitude, row.longitude]
                                                );
                                                // Send the location image to the user via Telegram
                                                await bot.telegram.sendPhoto(userId, { source: locationImagePath });
                                                console.log('Location image sent successfully.');
                        
                                                // Send the additional image to the user via Telegram
                                                await bot.telegram.sendPhoto(userId, { source: additionalImagePath });
                                                console.log('Additional image sent successfully.');
                        
                                                // Delete the image files after sending
                                                fs.unlink(locationImagePath, (err) => {
                                                    if (err) {
                                                        console.error('Error deleting location image:', err.message);
                                                    } else {
                                                        console.log('Location image deleted successfully.');
                                                    }
                                                });
                        
                                                fs.unlink(additionalImagePath, (err) => {
                                                    if (err) {
                                                        console.error('Error deleting additional image:', err.message);
                                                    } else {
                                                        console.log('Additional image deleted successfully.');
                                                    }
                                                });
                        
                                                // Send confirmation message to user
                                                await bot.telegram.sendMessage(
                                                    userId,
                                                    `Ձեր գործարքը վավեր է և հաջողությամբ մշակվել է:\nԿոորդինատներ : ${longitude}, ${latitude} \n https://yandex.com/maps/?ll=${longitude}%2C${latitude}`,
                                                    { parse_mode: 'HTML' }
                                                );
                                            } catch (error) {
                                                console.error('Error sending images or message to Telegram:', error.message);
                                                return res.status(500).send('Error sending images or message to Telegram');
                                            }
                                        });
                                    }
                                });
                                await client.query(
                                    'INSERT INTO bought (user_id, name, location_image, weight, additional_image, latitude, longitude, product_id,identifier) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                                    [
                                        userId,
                                        row.name,
                                        row.location_image,
                                        row.weight, // Assuming you want to save the same image
                                        row.additional_image, // Assuming additional_image is not provided
                                        row.latitude,
                                        row.longitude,
                                        row.identifier,
                                        row.identifier
                                    ]
                                );

                                await client.query('DELETE FROM products WHERE identifier = $1', [productId]);
                                console.log('Product deleted successfully.');
                            } else {
                                console.log('No location image found for the product.');
                                // Send a message without image if needed
                                await bot.telegram.sendMessage(
                                    userId,
                                    'Ձեր գործարքը վավեր է և հաջողությամբ մշակվել է:'
                                );

                                // Send confirmation message to user
                                await bot.telegram.sendMessage(
                                    userId,
                                    `Ձեր գործարքը վավեր է և հաջողությամբ մշակվել է:\nԿոորդինատներ : ${longitude}, ${latitude} \n https://yandex.com/maps/?ll=${longitude}%2C${latitude}`,
                                    { parse_mode: 'HTML' }
                                );
                            }
                        } else {
                            console.log('No product found for the given product ID.');
                            await bot.telegram.sendMessage(
                                userId,
                                `Ստացել ենք ձեր փոխանցումը բայց չկարողացանք հաստատել ապրանքի առկայությունը, խնդրում ենք կապնվել օպերատորին`,
                                { parse_mode: 'HTML' }
                            );
                        }
                    } else {
                        console.log('Transaction amount is less than required. Amount:', amountInFloat, 'Required:', amountInLtc);
                        await bot.telegram.sendMessage(
                            userId,
                            'Գործարքի գումարը պահանջվածից պակաս է:'
                        );
                    }
                } else {
                    // No pending orders for the user
                    console.log('No transactions found for the user.');
                    await bot.telegram.sendMessage(
                        userId,
                        'Մենք չգտանք ձեր գործարքը մեր տվյալներում:'
                    );
                }

                // Send a success response after all operations are complete
                res.status(200).send('Webhook processed successfully');
            } else {
                console.log('Webhook type is not receive. Type:', type);
                res.status(400).send('Invalid webhook type');
            }
        } catch (error) {
            console.error('Error processing webhook:', error.message);
            res.status(500).send('Internal Server Error');
        }
    });
});

app.post('/api/pay-part-with-balance', async (req, res) => {
    const { userId, newPrice } = req.body;

    // Validate input
    if (!userId || newPrice === undefined) {
        return res.status(400).json({ error: 'User ID and new price are required.' });
    }

    try {
        // Update the price column in the orders table for the given user_id
        const result = await client.query(
            'UPDATE orders SET price = $1, status = $2 WHERE user_id = $3 RETURNING *',
            [newPrice, 'updated', userId]
        );

        // Check if any row was updated
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No order found for the provided user ID.' });
        }

        console.log('Order updated successfully:', result.rows[0]);

        // Update the user's balance to 0 in the users table
        await client.query(
            'UPDATE users SET balance = 0 WHERE user_id = $1',
            [userId]
        );

        console.log(`User balance updated to 0 for user ID: ${userId}`);
        
        // Send response back to the client
        res.status(200).json({ message: 'Order price updated successfully and user balance set to 0.', order: result.rows[0] });
    } catch (error) {
        console.error('Error updating order price or user balance:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});



app.post('/api/pay-with-balance', async (req, res) => {
    const { userId, price, productId } = req.body;

    // Validate input
    if (!userId || price === undefined || !productId) {
        return res.status(400).json({ error: 'User ID, price, and product ID are required.' });
    }

    try {
        // Start a transaction to ensure both the order deletion and balance deduction happen together
        await client.query('BEGIN');

        // Fetch the current balance of the user
        const balanceResult = await client.query(
            'SELECT balance FROM users WHERE user_id = $1',
            [userId]
        );

        // Check if user exists and has a balance
        if (balanceResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found.' });
        }

        const currentBalance = balanceResult.rows[0].balance;

        // Check if the balance is sufficient to cover the price
        if (currentBalance < price) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient balance.' });
        }

        // Deduct the price from the user's balance
        const newBalance = currentBalance - price;
        await client.query(
            'UPDATE users SET balance = $1 WHERE user_id = $2',
            [newBalance, userId]
        );

        // Delete the order from the orders table
        const orderResult = await client.query(
            'DELETE FROM orders WHERE user_id = $1 RETURNING *',
            [userId]
        );

        // Check if the order was deleted
        if (orderResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'No order found for the provided user ID.' });
        }

        // Fetch product details from the products table using the correct productId
        const productResult = await client.query(
            'SELECT longitude, latitude, weight, name, type, identifier, product_image, location_image, location, location_id, additional_image FROM products WHERE identifier = $1',
            [productId] // Use productId as string since it corresponds to the identifier field
        );

        // Check if the product was found
        if (productResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found.' });
        }

        const productData = productResult.rows[0];

        // Insert the product data into the bought table
        await client.query(
            'INSERT INTO bought (user_id, longitude, latitude, weight, name, type, identifier, product_image, location_image, location, location_id, additional_image, product_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
            [
                userId,
                productData.longitude,
                productData.latitude,
                productData.weight,
                productData.name,
                productData.type,
                productData.identifier,
                productData.product_image,
                productData.location_image,
                productData.location,
                productData.location_id, // Make sure this is of type integer
                productData.additional_image,
                productId // Use productId here as a string
            ]
        );
        await client.query(
            'DELETE FROM products WHERE identifier = $1 RETURNING *',
            [productId]
        );
        // Commit the transaction
        await client.query('COMMIT');

        console.log('Order paid successfully, balance deducted, and product saved to bought table:', productData);

        // Send response back to the client
        res.status(200).json({ message: 'Order paid successfully, balance deducted, and product saved to bought table.', product: productData, newBalance });
    } catch (error) {
        // Rollback transaction in case of error
        await client.query('ROLLBACK');
        console.error('Error processing payment with balance:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});




// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

