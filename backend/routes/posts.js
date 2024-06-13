const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// 게시글 스키마 정의
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// 게시글 생성
router.post('/', async (req, res) => {
  const { title, content, author = '관리자' } = req.body;
  const post = new Post({ title, content, author });
  await post.save();
  res.status(201).send(post);
});

// 게시글 목록 조회 (페이지네이션 포함)
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  res.send(post);
});

// 게시글 수정
router.put('/:id', async (req, res) => {
  const { title, content } = req.body;
  const post = await Post.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
  res.send(post);
});

// 게시글 삭제
router.delete('/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
