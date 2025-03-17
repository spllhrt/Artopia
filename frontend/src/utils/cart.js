import * as SQLite from 'expo-sqlite';

// Database version - increment this when schema changes
const DB_VERSION = 2;

// Global database connection
let db = null;
let isInitializing = false;
let initPromise = null;

// Initialize the database
export const initDatabase = async () => {
  // If already initializing, return the existing promise
  if (isInitializing) {
    return initPromise;
  }
  
  // If already initialized, return success
  if (db) {
    return { success: true };
  }
  
  isInitializing = true;
  initPromise = (async () => {
    try {
      console.log('Opening database connection...');
      // Open the database and store the connection
      db = await SQLite.openDatabaseAsync('artshop.db');
      console.log('Database opened successfully');
      
      // Check and update database schema to current version
      await updateDatabaseSchema();
      return { success: true };
    } catch (error) {
      console.error('Error initializing database:', error);
      // Reset the db variable so we can try again
      db = null;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();
  
  return initPromise;
};

// Reset database (delete and recreate)
export const resetDatabase = async () => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
  
  try {
    // Delete the database file
    await SQLite.deleteAsync('artshop.db');
    console.log('Database deleted successfully');
    
    // Reinitialize the database
    return await initDatabase();
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

// Database schema versioning system
const updateDatabaseSchema = async () => {
  try {
    // Create version table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS db_version (
        version INTEGER PRIMARY KEY
      );
    `);
    
    // Get current version
    const versionResult = await db.getAllAsync('SELECT version FROM db_version LIMIT 1;');
    const currentVersion = versionResult.length > 0 ? versionResult[0].version : 0;
    console.log(`Current database version: ${currentVersion}, Target version: ${DB_VERSION}`);
    
    if (currentVersion < DB_VERSION) {
      console.log(`Upgrading database from version ${currentVersion} to ${DB_VERSION}`);
      
      // Apply migrations based on version
      if (currentVersion < 1) {
        // Initial schema creation
        await createInitialSchema();
      }
      
      if (currentVersion < 2) {
        // Add user_id column if upgrading to version 2
        await addUserIdColumn();
      }
      
      // Update version in database
      if (currentVersion === 0) {
        await db.runAsync('INSERT INTO db_version (version) VALUES (?);', [DB_VERSION]);
      } else {
        await db.runAsync('UPDATE db_version SET version = ?;', [DB_VERSION]);
      }
      
      console.log(`Database upgraded to version ${DB_VERSION}`);
    }
  } catch (error) {
    console.error('Error updating database schema:', error);
    throw error;
  }
};

// Create initial schema (version 1)
const createInitialSchema = async () => {
  try {
    // Create cart table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        product_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Cart table created successfully');

    // Create artwork products table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS artwork_products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT,
        price REAL NOT NULL,
        imageUrl TEXT,
        status TEXT,
        category TEXT,
        description TEXT,
        height REAL,
        width REAL,
        depth REAL,
        unit TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Artwork products table created successfully');

    // Create artmat products table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS artmat_products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        imageUrl TEXT,
        category TEXT,
        description TEXT,
        stock INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Art material products table created successfully');
  } catch (error) {
    console.error('Error creating initial schema:', error);
    throw error;
  }
};

// Add user_id column migration (version 2)
const addUserIdColumn = async () => {
  try {
    console.log('Adding user_id column to cart table...');
    // Check if user_id column exists
    const tableInfo = await db.getAllAsync("PRAGMA table_info(cart);");
    const hasUserIdColumn = tableInfo.some(column => column.name === 'user_id');
    
    if (!hasUserIdColumn) {
      // SQLite doesn't support NOT NULL for ALTER TABLE ADD COLUMN unless a default value is provided
      await db.execAsync(`
        ALTER TABLE cart ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';
      `);
      console.log('User_id column added successfully');
    } else {
      console.log('User_id column already exists');
    }
  } catch (error) {
    console.error('Error adding user_id column:', error);
    throw error;
  }
};

// Ensure database is initialized before any operation
const ensureDbInitialized = async () => {
  if (!db) {
    console.log('Database not initialized, initializing now...');
    await initDatabase();
    if (!db) {
      throw new Error('Failed to initialize database');
    }
  }
};

// Add artwork to cart (always with quantity = 1)
export const addArtworkToCart = async (artwork, userId) => {
  await ensureDbInitialized();
  
  try {
    // Validate artwork object
    if (!artwork || typeof artwork !== 'object') {
      throw new Error('Invalid artwork object');
    }
    
    if (!artwork.id) {
      throw new Error('Artwork is missing ID');
    }
    
    // Validate user ID
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Log for debugging
    console.log('Adding to cart, artwork ID:', artwork.id, 'for user:', userId);
    
    // First check if the artwork already exists in the product table
    const [existingProduct] = await db.getAllAsync(
      'SELECT * FROM artwork_products WHERE id = ?;',
      [artwork.id]
    );
    
    if (!existingProduct) {
      // Default values for missing properties
      const title = artwork.title || 'Untitled Artwork';
      const artist = artwork.artist || 'Unknown Artist';
      const price = artwork.price || 0;
      
      // Insert artwork into products table
      await db.runAsync(
        `INSERT INTO artwork_products (
          id, title, artist, price, imageUrl, status, 
          category, description, height, width, depth, unit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          artwork.id,
          title,
          artist,
          price,
          Array.isArray(artwork.images) && artwork.images.length > 0 
            ? (typeof artwork.images[0] === 'string' ? artwork.images[0] : artwork.images[0]?.url)
            : null,
          artwork.status || null,
          artwork.category || null,
          artwork.description || null,
          artwork.dimensions?.height || null,
          artwork.dimensions?.width || null,
          artwork.dimensions?.depth || null,
          artwork.dimensions?.unit || null
        ]
      );
      console.log('Artwork product details saved');
    }

    // Check if product already exists in cart for this user
    const [existingCartItem] = await db.getAllAsync(
      'SELECT * FROM cart WHERE product_id = ? AND product_type = "artwork" AND user_id = ?;',
      [artwork.id, userId]
    );
    
    if (existingCartItem) {
      // Artwork already in cart - do nothing
      // Each artwork can only be added once
      return { success: true, alreadyInCart: true };
    } else {
      // Add new product to cart with quantity=1
      const result = await db.runAsync(
        'INSERT INTO cart (user_id, product_id, product_type, quantity) VALUES (?, ?, ?, ?);',
        [userId, artwork.id, "artwork", 1]
      );
      return { success: true, insertId: result.lastInsertRowId };
    }
  } catch (error) {
    console.error('Error adding artwork to cart:', error);
    throw error;
  }
};

// Add art material to cart
export const addArtmatToCart = async (artmat, userId, quantity = 1) => {
  await ensureDbInitialized();
  
  try {
    // Validate artmat object
    if (!artmat || typeof artmat !== 'object') {
      throw new Error('Invalid art material object');
    }
    
    if (!artmat.id) {
      throw new Error('Art material is missing ID');
    }
    
    // Validate user ID
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // First check if the art material already exists in the product table
    const [existingProduct] = await db.getAllAsync(
      'SELECT * FROM artmat_products WHERE id = ?;',
      [artmat.id]
    );
    
    if (!existingProduct) {
      // Default values for missing properties
      const name = artmat.name || 'Unnamed Art Material';
      const price = artmat.price || 0;
      const stock = artmat.stock || 0;
      
      // Insert art material into products table
      await db.runAsync(
        `INSERT INTO artmat_products (
          id, name, price, imageUrl, category, description, stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          artmat.id,
          name,
          price,
          Array.isArray(artmat.images) && artmat.images.length > 0 
            ? (typeof artmat.images[0] === 'string' ? artmat.images[0] : artmat.images[0]?.url)
            : null,
          artmat.category || null,
          artmat.description || null,
          stock
        ]
      );
      console.log('Art material product details saved');
    }

    // Check if product already exists in cart for this user
    const [existingCartItem] = await db.getAllAsync(
      'SELECT * FROM cart WHERE product_id = ? AND product_type = "artmat" AND user_id = ?;',
      [artmat.id, userId]
    );
    
    if (existingCartItem) {
      // Update quantity if product already in cart
      const existingQuantity = existingCartItem.quantity;
      const newQuantity = existingQuantity + quantity;
      
      // Check if requested quantity exceeds stock
      if (newQuantity > artmat.stock) {
        throw new Error('Requested quantity exceeds available stock');
      }
      
      const result = await db.runAsync(
        'UPDATE cart SET quantity = ? WHERE product_id = ? AND product_type = ? AND user_id = ?;',
        [newQuantity, artmat.id, "artmat", userId]
      );
      return { success: true, rowsAffected: result.changes };
    } else {
      // Check if requested quantity exceeds stock
      if (quantity > artmat.stock) {
        throw new Error('Requested quantity exceeds available stock');
      }
      
      // Add new product to cart - explicitly specifying all parameters
      const result = await db.runAsync(
        'INSERT INTO cart (user_id, product_id, product_type, quantity) VALUES (?, ?, ?, ?);',
        [userId, artmat.id, "artmat", quantity]
      );
      return { success: true, insertId: result.lastInsertRowId };
    }
  } catch (error) {
    console.error('Error adding art material to cart:', error);
    throw error;
  }
};

// Get all items in cart with their details for a specific user
export const getCartItems = async (userId) => {
  await ensureDbInitialized();
  
  try {
    // Validate user ID
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Get all cart items for this user
    const cartItems = await db.getAllAsync(
      'SELECT * FROM cart WHERE user_id = ? ORDER BY date_added DESC;',
      [userId]
    );
    
    if (cartItems.length === 0) {
      return [];
    }
    
    // Get details for each item
    const result = [];
    
    for (const item of cartItems) {
      if (item.product_type === 'artwork') {
        const [product] = await db.getAllAsync(
          'SELECT * FROM artwork_products WHERE id = ?;',
          [item.product_id]
        );
        
        if (product) {
          result.push({
            cartId: item.id,
            userId: item.user_id,
            quantity: 1, // Always 1 for artwork
            productType: 'artwork',
            product: {
              id: product.id,
              title: product.title,
              artist: product.artist,
              price: product.price,
              imageUrl: product.imageUrl,
              status: product.status,
              category: product.category,
              description: product.description,
              dimensions: {
                height: product.height,
                width: product.width,
                depth: product.depth,
                unit: product.unit
              }
            }
          });
        }
      } else if (item.product_type === 'artmat') {
        const [product] = await db.getAllAsync(
          'SELECT * FROM artmat_products WHERE id = ?;',
          [item.product_id]
        );
        
        if (product) {
          result.push({
            cartId: item.id,
            userId: item.user_id,
            quantity: item.quantity,
            productType: 'artmat',
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              category: product.category,
              description: product.description,
              stock: product.stock
            }
          });
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching cart items:', error);
    throw error;
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (cartId, newQuantity, userId) => {
  await ensureDbInitialized();
  
  try {
    // Validate user ID
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (newQuantity <= 0) {
      // If quantity is 0 or less, remove the item
      return await removeCartItem(cartId, userId);
    }
    
    // Get the cart item
    const [item] = await db.getAllAsync(
      'SELECT * FROM cart WHERE id = ? AND user_id = ?;',
      [cartId, userId]
    );
    
    if (!item) {
      throw new Error('Cart item not found or does not belong to user');
    }
    
    // Don't allow quantity updates for artwork
   // Don't allow quantity updates for artwork
   if (item.product_type === 'artwork') {
    return { success: true, message: 'Artwork quantity is always 1' };
  }
  
  // For art materials, check stock availability
  if (item.product_type === 'artmat') {
    // Get product details to check stock
    const [product] = await db.getAllAsync(
      'SELECT * FROM artmat_products WHERE id = ?;',
      [item.product_id]
    );
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Check if requested quantity exceeds stock
    if (newQuantity > product.stock) {
      throw new Error('Requested quantity exceeds available stock');
    }
    
    // Update quantity
    const result = await db.runAsync(
      'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?;',
      [newQuantity, cartId, userId]
    );
    
    return { success: true, rowsAffected: result.changes };
  }
  
  throw new Error('Unknown product type');
} catch (error) {
  console.error('Error updating cart item quantity:', error);
  throw error;
}
};

// Remove item from cart
export const removeCartItem = async (cartId, userId) => {
await ensureDbInitialized();

try {
  // Validate user ID
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Delete the cart item
  const result = await db.runAsync(
    'DELETE FROM cart WHERE id = ? AND user_id = ?;',
    [cartId, userId]
  );
  
  if (result.changes === 0) {
    throw new Error('Cart item not found or does not belong to user');
  }
  
  return { success: true, rowsAffected: result.changes };
} catch (error) {
  console.error('Error removing cart item:', error);
  throw error;
}
};

// Clear entire cart for a user
export const clearCart = async (userId) => {
await ensureDbInitialized();

try {
  // Validate user ID
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Delete all cart items for this user
  const result = await db.runAsync(
    'DELETE FROM cart WHERE user_id = ?;',
    [userId]
  );
  
  return { success: true, rowsAffected: result.changes };
} catch (error) {
  console.error('Error clearing cart:', error);
  throw error;
}
};

// Get cart count for a user
export const getCartCount = async (userId) => {
await ensureDbInitialized();

try {
  // Validate user ID
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Get count of items in cart
  const [result] = await db.getAllAsync(
    'SELECT SUM(quantity) as total FROM cart WHERE user_id = ?;',
    [userId]
  );
  
  return result.total || 0;
} catch (error) {
  console.error('Error getting cart count:', error);
  throw error;
}
};

// Close the database connection
export const closeDatabase = async () => {
if (db) {
  try {
    await db.closeAsync();
    db = null;
    console.log('Database closed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error closing database:', error);
    throw error;
  }
}
return { success: true, message: 'Database was not open' };
};