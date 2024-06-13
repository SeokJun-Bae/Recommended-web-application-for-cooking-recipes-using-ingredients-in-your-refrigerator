const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const userRoutes = require('./userRoutes');
const Recipe = require('./models/Recipe');
const authMiddleware = require('./middleware/authMiddleware');
const postRoutes = require('./routes/posts');
const User = require('./userModel');

const app = express();
const PORT = 5000;

const JWT_SECRET = 'your_jwt_secret';

// MongoDB Atlas 연결 문자열
const mongoURI = "mongodb+srv://jung04070:tjrwns33@cluster.wo3fare.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster";

// MongoDB Atlas 연결
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 라우트 설정
app.use('/api/auth', userRoutes);
app.use('/api/posts', postRoutes);

// 추천 메뉴 엔드포인트
app.get('/recommend', async (req, res) => {
  const ingredient = req.query.ingredient;
  console.log('Requested ingredient:', ingredient);
  try {
    const recipes = await Recipe.find({ ingredients: ingredient });
    console.log('Found recipes:', recipes);
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 게시글 생성 엔드포인트
app.post('/api/posts', authMiddleware, async (req, res) => {
  const Post = require('./models/Post');  // Post 모델을 require 문으로 불러옵니다.
  const { title, content } = req.body;
  const author = req.user.name;  // req.user는 미들웨어를 통해 설정된 사용자 정보
  const post = new Post({ title, content, author });
  await post.save();
  res.status(201).send(post);
});

// 게시글 목록 조회 (페이지네이션 포함)
app.get('/api/posts', async (req, res) => {
  const Post = require('./models/Post');  // Post 모델을 require 문으로 불러옵니다.
  const { page = 1, limit = 10 } = req.query;
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const totalPosts = await Post.countDocuments();
  const totalPages = Math.ceil(totalPosts / limit);
  res.send({ posts, totalPages });
});

// 게시글 상세 조회
app.get('/api/posts/:id', async (req, res) => {
  const Post = require('./models/Post');  // Post 모델을 require 문으로 불러옵니다.
  const post = await Post.findById(req.params.id);
  res.send(post);
});

// 게시글 삭제 엔드포인트
app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
  const Post = require('./models/Post');  // Post 모델을 require 문으로 불러옵니다.
  const { id } = req.params;
  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    await post.remove();
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 게시글 수정 엔드포인트
app.put('/api/posts/:id', authMiddleware, async (req, res) => {
  const Post = require('./models/Post');  // Post 모델을 require 문으로 불러옵니다.
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send({ message: 'Post not found' });
    }

    post.title = req.body.title;
    post.content = req.body.content;
    await post.save();

    res.send(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).send({ message: 'Server error' });
  }
});

// 사용자 인증 및 JWT 발급
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }); // 암호화된 비밀번호 사용을 가정합니다.
  
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// 인증 미들웨어
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }
  
    req.user = decoded;
    next();
  });
};

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
