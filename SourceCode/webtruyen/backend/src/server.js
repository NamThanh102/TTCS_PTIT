require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const comicRoutes = require('./routes/comicRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const chapterRoutes = require('./routes/chapterRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { commentRouter, latestRouter } = require('./routes/commentRoutes');
const { errorHandler } = require('./middlewares/errorHandler');
const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/comics', comicRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments/latest', latestRouter);
app.use('/api/comics/:comicId/comments', commentRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});