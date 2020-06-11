const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const upload = require('../middleware/upload')
const router = new express.Router()

// Create user
router.post('/users', async (req, res) => {
  const user = new User(req.body)

  try {
    await user.save()
    res.status(201).send({ user })
  } catch (e) {
    res.status(400).send(e)
  }
})

// Login
router.post('/users/login', async (req, res) => {
  try {
    const { body: { email, password } } = req

    const user = await User.findByCredentials(email, password)
    const token = await user.generateAuthToken()
    res.send({ user, token })
  } catch (e) {
    res.status(400).send()
  }
})

// Logout
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

// Logout all
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

// Get users
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({})
    res.send(users)
  } catch (e) {
    res.status(500).send()
  }
})

// Get me
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})

// Get user by id
router.get('/users/:id', async (req, res) => {
  const { params: { id } } = req

  try {
    const user = await User.findById(id)
      if (!user)
        res.status(404).send()
      res.send(user)
  } catch (e) {
    res.status(500).send()
  }
})

// Update user
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'password', 'email', 'age']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!'})
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update])
    await req.user.save()
    res.send(req.user)
  } catch (e) {
    res.status(500).send(e)
  }
})

// Delete user
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove()
    res.send(req.user)
  } catch (e) {
    console.log(e)
    res.status(500).send(e)
  }
})

// Avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  req.user.avatar = req.file.buffer
  await req.user.save()
  res.send()
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  req.user.avatar = undefined 
  await req.user.save()
  res.send()
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error('no user')
    }

    res.set('Content-Type', 'image/jpg')
    res.send(user.avatar)
  } catch (e) {
    res.status(404).send()
  }
})

module.exports = router