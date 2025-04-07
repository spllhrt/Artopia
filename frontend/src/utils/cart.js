import * as SQLite from 'expo-sqlite';

const DB_VERSION = 3; // Increased version for the new changes
let db = null;
let isInitializing = false;
let initPromise = null;

export const initDatabase = async () => {
  if (isInitializing) {
    return initPromise;
  }
  
  if (db) {
    return { success: true };
  }
  
  isInitializing = true;
  initPromise = (async () => {
    try {
      console.log('Opening database connection...');
      db = await SQLite.openDatabaseAsync('art.db');
      console.log('Database opened successfully');
      
      await updateDatabaseSchema();
      return { success: true };
    } catch (error) {
      console.error('Error initializing database:', error);
      db = null;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();
  
  return initPromise;
};

export const resetDatabase = async () => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
  
  try {
    await SQLite.deleteAsync('art.db');
    console.log('Database deleted successfully');
    
    return await initDatabase();
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

const updateDatabaseSchema = async () => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS db_version (
        version INTEGER PRIMARY KEY
      );
    `);
    
    const versionResult = await db.getAllAsync('SELECT version FROM db_version LIMIT 1;');
    const currentVersion = versionResult.length > 0 ? versionResult[0].version : 0;
    console.log(`Current database version: ${currentVersion}, Target version: ${DB_VERSION}`);
    
    if (currentVersion < DB_VERSION) {
      console.log(`Upgrading database from version ${currentVersion} to ${DB_VERSION}`);
      
      if (currentVersion < 1) {
        await createInitialSchema();
      }
      
      if (currentVersion < 2) {
        await addUserIdColumn();
      }
      
      if (currentVersion < 3) {
        await addLastUpdatedColumns();
      }
      
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

// Add last_updated columns migration (version 3) - Fixed to use NULL default instead of CURRENT_TIMESTAMP
const addLastUpdatedColumns = async () => {
  try {
    console.log('Adding last_updated columns to product tables...');
    
    // Add last_updated column to artwork_products
    const artworkTableInfo = await db.getAllAsync("PRAGMA table_info(artwork_products);");
    const hasArtworkLastUpdated = artworkTableInfo.some(column => column.name === 'last_updated');
    
    if (!hasArtworkLastUpdated) {
      await db.execAsync(`
        ALTER TABLE artwork_products ADD COLUMN last_updated TIMESTAMP;
      `);
      
      // Update all existing rows to set last_updated to current time
      await db.runAsync(`
        UPDATE artwork_products SET last_updated = CURRENT_TIMESTAMP;
      `);
      
      console.log('Last_updated column added to artwork_products successfully');
    }
    
    // Add last_updated column to artmat_products
    const artmatTableInfo = await db.getAllAsync("PRAGMA table_info(artmat_products);");
    const hasArtmatLastUpdated = artmatTableInfo.some(column => column.name === 'last_updated');
    
    if (!hasArtmatLastUpdated) {
      await db.execAsync(`
        ALTER TABLE artmat_products ADD COLUMN last_updated TIMESTAMP;
      `);
      
      // Update all existing rows to set last_updated to current time
      await db.runAsync(`
        UPDATE artmat_products SET last_updated = CURRENT_TIMESTAMP;
      `);
      
      console.log('Last_updated column added to artmat_products successfully');
    }
  } catch (error) {
    console.error('Error adding last_updated columns:', error);
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

// Function to update artwork information
export const updateArtworkProduct = async (artwork) => {
  await ensureDbInitialized();
  
  try {
    // Validate artwork object
    if (!artwork || typeof artwork !== 'object' || !artwork.id) {
      throw new Error('Invalid artwork object');
    }
    
    // Check if artwork exists in database
    const [existingArtwork] = await db.getAllAsync(
      'SELECT * FROM artwork_products WHERE id = ?;',
      [artwork.id]
    );
    
    const title = artwork.title || 'Untitled Artwork';
    const artist = artwork.artist || 'Unknown Artist';
    const price = artwork.price || 0;
    const imageUrl = Array.isArray(artwork.images) && artwork.images.length > 0 
      ? (typeof artwork.images[0] === 'string' ? artwork.images[0] : artwork.images[0]?.url)
      : null;
    
    if (existingArtwork) {
      // Update existing artwork
      await db.runAsync(
        `UPDATE artwork_products SET 
          title = ?, artist = ?, price = ?, imageUrl = ?, status = ?, 
          category = ?, description = ?, height = ?, width = ?, depth = ?, 
          unit = ?, last_updated = CURRENT_TIMESTAMP
        WHERE id = ?;`,
        [
          title,
          artist,
          price,
          imageUrl,
          artwork.status || null,
          artwork.category || null,
          artwork.description || null,
          artwork.dimensions?.height || null,
          artwork.dimensions?.width || null,
          artwork.dimensions?.depth || null,
          artwork.dimensions?.unit || null,
          artwork.id
        ]
      );
      console.log(`Artwork ${artwork.id} updated`);
    } else {
      // Insert new artwork
      await db.runAsync(
        `INSERT INTO artwork_products (
          id, title, artist, price, imageUrl, status, 
          category, description, height, width, depth, unit, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
        [
          artwork.id,
          title,
          artist,
          price,
          imageUrl,
          artwork.status || null,
          artwork.category || null,
          artwork.description || null,
          artwork.dimensions?.height || null,
          artwork.dimensions?.width || null,
          artwork.dimensions?.depth || null,
          artwork.dimensions?.unit || null
        ]
      );
      console.log(`Artwork ${artwork.id} inserted`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating artwork product:', error);
    throw error;
  }
};

// Function to update art material information
export const updateArtmatProduct = async (artmat) => {
  await ensureDbInitialized();
  
  try {
    // Validate artmat object
    if (!artmat || typeof artmat !== 'object' || !artmat.id) {
      throw new Error('Invalid artmat object');
    }
    
    // Check if artmat exists in database
    const [existingArtmat] = await db.getAllAsync(
      'SELECT * FROM artmat_products WHERE id = ?;',
      [artmat.id]
    );
    
    const name = artmat.name || 'Unnamed Art Material';
    const price = artmat.price || 0;
    const stock = artmat.stock || 0;
    const imageUrl = Array.isArray(artmat.images) && artmat.images.length > 0 
      ? (typeof artmat.images[0] === 'string' ? artmat.images[0] : artmat.images[0]?.url)
      : null;
    
    if (existingArtmat) {
      // Update existing artmat
      await db.runAsync(
        `UPDATE artmat_products SET 
          name = ?, price = ?, imageUrl = ?, category = ?, 
          description = ?, stock = ?, last_updated = CURRENT_TIMESTAMP
        WHERE id = ?;`,
        [
          name,
          price,
          imageUrl,
          artmat.category || null,
          artmat.description || null,
          stock,
          artmat.id
        ]
      );
      console.log(`Artmat ${artmat.id} updated`);
    } else {
      // Insert new artmat
      await db.runAsync(
        `INSERT INTO artmat_products (
          id, name, price, imageUrl, category, description, stock, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
        [
          artmat.id,
          name,
          price,
          imageUrl,
          artmat.category || null,
          artmat.description || null,
          stock
        ]
      );
      console.log(`Artmat ${artmat.id} inserted`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating artmat product:', error);
    throw error;
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
    
    // Always update the artwork information when adding to cart
    await updateArtworkProduct(artwork);
    
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
    
    // Always update the artmat information when adding to cart
    await updateArtmatProduct(artmat);
    
    // Check if product already exists in cart for this user
    const [existingCartItem] = await db.getAllAsync(
      'SELECT * FROM cart WHERE product_id = ? AND product_type = "artmat" AND user_id = ?;',
      [artmat.id, userId]
    );
    
    if (existingCartItem) {
      // Update quantity if product already in cart
      const existingQuantity = existingCartItem.quantity;
      const newQuantity = existingQuantity + quantity;
      
      // Get the latest stock information
      const [product] = await db.getAllAsync(
        'SELECT stock FROM artmat_products WHERE id = ?;',
        [artmat.id]
      );
      
      // Check if requested quantity exceeds stock
      if (newQuantity > product.stock) {
        throw new Error('Requested quantity exceeds available stock');
      }
      
      const result = await db.runAsync(
        'UPDATE cart SET quantity = ? WHERE product_id = ? AND product_type = ? AND user_id = ?;',
        [newQuantity, artmat.id, "artmat", userId]
      );
      return { success: true, rowsAffected: result.changes };
    } else {
      // Get the latest stock information
      const [product] = await db.getAllAsync(
        'SELECT stock FROM artmat_products WHERE id = ?;',
        [artmat.id]
      );
      
      // Check if requested quantity exceeds stock
      if (quantity > product.stock) {
        throw new Error('Requested quantity exceeds available stock');
      }
      
      // Add new product to cart
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
export const getCartItems = async (userId, fetchLatestData = false, apiClient = null) => {
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
    
    // If fetchLatestData is true and apiClient is provided, refresh the product data
    if (fetchLatestData && apiClient) {
      for (const item of cartItems) {
        try {
          if (item.product_type === 'artwork') {
            const freshArtworkData = await apiClient.getArtworkById(item.product_id);
            if (freshArtworkData) {
              await updateArtworkProduct(freshArtworkData);
            }
          } else if (item.product_type === 'artmat') {
            const freshArtmatData = await apiClient.getArtMatById(item.product_id);
            if (freshArtmatData) {
              await updateArtmatProduct(freshArtmatData);
            }
          }
        } catch (error) {
          console.warn(`Failed to refresh data for ${item.product_type} ${item.product_id}:`, error);
          // Continue with stale data if refresh fails
        }
      }
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
              },
              lastUpdated: product.last_updated
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
              stock: product.stock,
              lastUpdated: product.last_updated
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