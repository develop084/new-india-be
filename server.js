const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier'); // Import streamifier
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://patidardev084:DFm9gcg5js9JmbaH@cluster0.q8cm85l.mongodb.net', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

// Define a Product schema
const ProductSchema = new mongoose.Schema({
  title: String,
  inStock: Boolean,
  imageUrl: String,
});

const Product = mongoose.model('Product', ProductSchema);

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dts8hnbex',
  api_key: '575351439139976',
  api_secret: 'LX9gsZmzIXuqOUUplJS_9-OM0PM',
});

// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define your API endpoint
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    // Convert the buffer to a readable stream using streamifier
    const stream = streamifier.createReadStream(req.file.buffer);

    // Upload the image to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      { folder: 'product-images' ,
      transformation: [{ width: 220, height: 146, crop: 'fill' }],
    }, // Specify the folder in Cloudinary
      async (error, result) => {
        if (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          // Create a new product document in MongoDB
          const newProduct = new Product({
            title: req.body.title,
            inStock: req.body.inStock,
            imageUrl: result.secure_url, // Store the Cloudinary image URL
          });

          // Save the product to the database
          await newProduct.save();

          res.status(201).json({ message: 'Product created successfully' });
        }
      }
    );

    // Pipe the image stream to Cloudinary
    stream.pipe(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/get/products', async (req, res) => {
    try {
      const products = await Product.find();
      res.status(200).json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

app.delete('/delete/product', async (req, res) => {
    try {
      const { productId } = req.body;
  
      // Check if the product exists in the database
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Delete the product from the database
      await product.remove();
  
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
