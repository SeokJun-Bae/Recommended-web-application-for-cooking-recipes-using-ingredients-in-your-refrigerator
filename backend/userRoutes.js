// userRoutes.js
const express = require('express');
const { registerUser, authUser } = require('./userController');

const router = express.Router();

const User = require('./userModel');
const authMiddleware = require('./middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);

// 사용자 정보 수정
router.put('/update', authMiddleware, async (req, res) => {
  const { name, birth, gender, email, phone } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, birth, gender, email, phone },
      { new: true } // 업데이트된 문서를 반환
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
