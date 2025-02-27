if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const router = express.Router()
const multer = require('multer')
const upload = multer({ dest: 'temp/' })
const passport = require('../config/passport')
const helpers = require('../_helpers')

const tweetController = require('../controllers/api/tweetController')
const userController = require('../controllers/api/userController')
const replyController = require('../controllers/api/replyController')
const adminController = require('../controllers/api/adminController')

const authenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!user) {
      return res
        .status(401)
        .json({ status: 'error', message: "token doesn't exist" })
    }
    req.user = user
    return next()
  })(req, res, next)
}
const authenticatedUser = (req, res, next) => {
  if (helpers.getUser(req)) {
    if (helpers.getUser(req).role !== 'admin') {
      return next()
    }
    return res.json({ status: 'error', message: 'permission denied' })
  } else {
    return res.json({ status: 'error', message: 'permission denied' })
  }
}

const authenticatedAdmin = (req, res, next) => {
  if (helpers.getUser(req)) {
    if (helpers.getUser(req).role === 'admin') {
      return next()
    }
    return res.json({ status: 'error', message: 'permission denied' })
  } else {
    return res.json({ status: 'error', message: 'permission denied' })
  }
}

// 拿到當下使用者資料
router.get('/get_current_user', authenticated, userController.getCurrentUser)
//  使用者註冊路由
router.post('/users', userController.signUp)
//  使用者登入
router.post('/signIn', userController.signIn)
//  拿到某位使用者資料

// 取得追蹤人數前10的使用者
router.get(
  '/users/top',
  authenticated,
  authenticatedUser,
  userController.getTopUsers
)

// 取得所有追蹤者的資料
router.get(
  '/users/:id/followers',
  authenticated,
  authenticatedUser,
  userController.getFollowers
)
// 取得正在追蹤的使用者的資料
router.get(
  '/users/:id/followings',
  authenticated,
  authenticatedUser,
  userController.getFollowings
)
// get a specific user
router.get(
  '/users/:id',
  authenticated,
  authenticatedUser,
  userController.getUser
)

// 編輯個人名稱，內容，大頭照，背景照路由
router.put(
  '/users/:id',
  authenticated,
  authenticatedUser,
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'avatar', maxCount: 1 }
  ]), userController.putUser)
// 帳戶設定路由
router.put(
  '/users/:id/revise',
  authenticated,
  authenticatedUser,
  userController.reviseUser
)

//  查詢user的所有推文
router.get(
  '/users/:userId/tweets',
  authenticated,
  authenticatedUser,
  userController.getUserTweets
)
// 查詢user的所有likes的推文
router.get(
  '/users/:userId/likes',
  authenticated,
  authenticatedUser,
  userController.getUserLikes
)

//  查詢user的所有留言
router.get(
  '/users/:userId/replied_tweets',
  authenticated,
  authenticatedUser,
  userController.getUserReplies
)

// 新增一篇堆文
router.post(
  '/tweets',
  authenticated,
  authenticatedUser,
  tweetController.postTweet
)
// 拿到所有推文，包括作者的推文
router.get(
  '/tweets',
  authenticated,
  authenticatedUser,
  tweetController.getTweets
)
// 拿到一筆推文與回覆
router.get(
  '/tweets/:id',
  authenticated,
  authenticatedUser,
  tweetController.getTweet
)

// 新增一筆推文的回覆
router.post(
  '/tweets/:tweet_id/replies',
  authenticated,
  authenticatedUser,
  replyController.postReply
)
// 瀏覽一筆推文的所有回覆
router.get(
  '/tweets/:tweet_id/replies',
  authenticated,
  authenticatedUser,
  replyController.getReplies
)

// 喜歡一則推文
router.post(
  '/tweets/:id/like',
  authenticated,
  authenticatedUser,
  userController.addLike
)
// 取消喜歡的貼文
router.post(
  '/tweets/:id/unlike',
  authenticated,
  authenticatedUser,
  userController.removeLike
)

// 新增一位追蹤者
router.post(
  '/followships',
  authenticated,
  authenticatedUser,
  userController.addFollowing
)
// 新增一位追蹤者
router.delete(
  '/followships/:followingId',
  authenticated,
  authenticatedUser,
  userController.removeFollowing
)

// 管理者可以看見站內所有的使用者
router.get(
  '/admin/users',
  authenticated,
  authenticatedAdmin,
  adminController.getUsers
)
// 管理者可以看見站內所有的推文
router.get(
  '/admin/tweets',
  authenticated,
  authenticatedAdmin,
  adminController.getTweets
)
// 管理者可以刪除特定推文
router.delete(
  '/admin/tweets/:id',
  authenticated,
  authenticatedAdmin,
  adminController.deleteTweet
)

// DARK MAGIC FOR DESTROYING DATA
router.delete('/destroyer/users', userController.deleteAllUsers)
router.delete('/destroyer/tweets', userController.deleteAllTweets)
router.delete('/destroyer/replies', userController.deleteAllReplies)

module.exports = router