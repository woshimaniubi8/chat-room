const express = require('express')
const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
const multer = require('multer')
const https = require('https')
const cors = require('cors')
const WebSocket = require('ws')

const ENABLE_HTTPS = false // 是否使用ssl加密，需配置证书
const PORT = 3000 // 服务器端口

var server
const app = express()

if (ENABLE_HTTPS) {
  const pKey = fs.readFileSync('privkey.pem', 'utf8') // 私钥
  const cert = fs.readFileSync('fullchain.pem', 'utf8') // 证书
  const cred = { key: pKey, cert: cert }
  const apps = https.createServer(cred, app)
  server = apps.listen(PORT, () => {
    console.log(`服务器运行在 https://localhost:${PORT}`)
  })
} else {
  server = app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`)
  })
}

const wss = new WebSocket.Server({ server })
const clients = new Set()
wss.on('connection', (ws) => {
  clients.add(ws)

  ws.on('close', () => {
    clients.delete(ws)
  })
})

// 广播消息
function broadcastMessage(message) {
  const data = JSON.stringify({ type: 'new-message' })
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
}

function broadcastGonggao() {
  const data = JSON.stringify({ type: 'new-gg' })
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
}
const DATA_DIR = path.join(__dirname, 'data')
const UPLOADS_DIR = path.join(__dirname, 'uploads')
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars')
const ATTACHMENTS_DIR = path.join(UPLOADS_DIR, 'attachments')

;[UPLOADS_DIR, AVATARS_DIR, ATTACHMENTS_DIR, DATA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json')
const NOTICE_FILE = path.join(DATA_DIR, 'notice.json')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, '[]', 'utf-8')
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf-8')

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'avatar') {
      cb(null, AVATARS_DIR)
    } else {
      cb(null, ATTACHMENTS_DIR)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2000 * 1024 * 1024, // 2000MB
    files: 15, // 最多5个文件
  },
})

let onlineUsers = {}

// 每5分钟清理一次不活跃用户（超过5分钟未活动）
setInterval(() => {
  const now = Date.now()
  Object.keys(onlineUsers).forEach((username) => {
    if (now - onlineUsers[username].lastActive > 5 * 60 * 1000) {
      delete onlineUsers[username]
    }
  })
}, 5 * 60 * 1000)

app.use(bodyParser.json())
app.use(cors())

const staticOptions = {
  setHeaders: (res, path) => {
    // 防止前端附件预览报错
    res.setHeader('X-Content-Type-Options', 'nosniff')
    if (path.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg')
    }
  },
}

app.use('/uploads', express.static(UPLOADS_DIR, staticOptions))
app.use(express.static('public', staticOptions))

// 头像上传
app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未选择文件' })
  }

  // 返回文件的URL路径（相对于服务器根目录）
  const filePath = req.file.path.replace(__dirname, '').replace(/\\/g, '/')
  res.json({
    url: filePath,
    filename: req.file.originalname,
  })
})
// 通用附件上传
app.post('/upload', upload.array('file', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '未选择文件' })
  }

  const results = req.files.map((file) => {
    const filePath = file.path.replace(__dirname, '').replace(/\\/g, '/')

    let originalName = file.originalname
    try {
      originalName = decodeURIComponent(originalName)
    } catch (e) {
      // 尝试从latin1转换到utf8
      if (typeof originalName === 'string' && /[^\x00-\x7F]/.test(originalName)) {
        originalName = Buffer.from(originalName, 'latin1').toString('utf8')
      }
    }

    return {
      url: filePath,
      type: file.mimetype.split('/')[0],
      name: originalName,
    }
  })

  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.json(results)
})

// 获取所有消息
app.get('/messages', (req, res) => {
  fs.readFile(MESSAGES_FILE, 'utf-8', (err, data) => {
    if (err) {
      console.error('读取消息文件失败:', err)
      return res.status(500).json({ error: '无法读取消息' })
    }

    try {
      const messages = JSON.parse(data)
      res.json(messages)
    } catch (parseErr) {
      console.log('解析消息失败:', parseErr)
      res.status(500).json({ error: '解析消息失败' })
    }
  })
})

// 创建新消息
app.post('/messages', (req, res) => {
  const newMessage = req.body

  // 验证消息内容
  if ((!newMessage.text || newMessage.text.trim() === '') && (!newMessage.attachments || newMessage.attachments.length === 0)) {
    return res.status(400).json({ error: '消息内容不能为空' })
  }

  onlineUsers[newMessage.username] = {
    username: newMessage.username,
    avatar: newMessage.avatar,
    lastActive: Date.now(),
  }

  fs.readFile(MESSAGES_FILE, 'utf-8', (err, data) => {
    if (err) {
      console.error('读取消息文件失败:', err)
      return res.status(500).json({ error: '无法读取消息' })
    }

    try {
      const messages = JSON.parse(data)
      messages.push(newMessage)

      fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8', (writeErr) => {
        if (writeErr) {
          console.error('写入消息文件失败:', writeErr)
          return res.status(500).json({ error: '无法保存消息' })
        }

        // 广播新消息通知
        broadcastMessage()

        res.status(201).json(newMessage)
      })
    } catch (parseErr) {
      console.error('解析消息失败:', parseErr)
      res.status(500).json({ error: '解析消息失败' })
    }
  })
})

app.get('/notice', (req, res) => {
  fs.readFile(NOTICE_FILE, 'utf-8', (err, data) => {
    if (err) {
      console.error('读取公告文件失败:', err)
      return res.status(500).json({ error: '无法读取公告' })
    }

    try {
      res.json(JSON.parse(data))
    } catch (parseErr) {
      console.log('解析失败:', parseErr)
      res.status(500).json({ error: '解析失败' })
    }
  })
})

app.post('/notice', (req, res) => {
  const noticeContent = req.body
  // 验证内容
  if (!noticeContent.text || noticeContent.text.trim() === '') {
    return res.status(400).json({ error: '公告内容不能为空' })
  }

  try {
    fs.writeFile(NOTICE_FILE, JSON.stringify(noticeContent, null, 2), 'utf-8', (writeErr) => {
      if (writeErr) {
        console.error('写入文件失败:', writeErr)
        return res.status(500).json({ error: '无法保存' })
      }

      res.status(201).json(noticeContent)
      broadcastGonggao()
    })
  } catch (parseErr) {
    console.error('解析失败:', parseErr)
    res.status(500).json({ error: '解析失败' })
  }
})

// 获取在线用户
app.get('/online-users', (req, res) => {
  // 返回在线用户列表
  const users = Object.values(onlineUsers).map((user) => ({
    username: user.username,
    avatar: user.avatar,
  }))
  res.json(users)
})
app.get('/message_manage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manage.html'))
})

// 删除消息接口
app.delete('/messages/:id', (req, res) => {
  const messageId = req.params.id

  fs.readFile(MESSAGES_FILE, 'utf-8', (err, data) => {
    if (err) {
      console.error('读取消息文件失败:', err)
      return res.status(500).json({ error: '无法读取消息' })
    }

    try {
      let messages = JSON.parse(data)
      const initialLength = messages.length
      messages = messages.filter((msg) => msg.id !== messageId)

      if (messages.length === initialLength) {
        return res.status(404).json({ error: '消息未找到' })
      }

      fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8', (writeErr) => {
        if (writeErr) {
          console.error('写入消息文件失败:', writeErr)
          return res.status(500).json({ error: '无法删除消息' })
        }

        // 广播消息删除通知
        broadcastMessage()

        res.status(200).json({ success: true })
      })
    } catch (parseErr) {
      console.error('解析消息失败:', parseErr)
      res.status(500).json({ error: '解析消息失败' })
    }
  })
})

// 更新消息接口
app.put('/messages/:id', (req, res) => {
  const messageId = req.params.id
  const { text } = req.body

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: '消息内容不能为空' })
  }

  fs.readFile(MESSAGES_FILE, 'utf-8', (err, data) => {
    if (err) {
      console.error('读取消息文件失败:', err)
      return res.status(500).json({ error: '无法读取消息' })
    }

    try {
      let messages = JSON.parse(data)
      const messageIndex = messages.findIndex((msg) => msg.id === messageId)

      if (messageIndex === -1) {
        return res.status(404).json({ error: '消息未找到' })
      }

      // 更新消息文本
      messages[messageIndex].text = text

      fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8', (writeErr) => {
        if (writeErr) {
          console.error('写入消息文件失败:', writeErr)
          return res.status(500).json({ error: '无法更新消息' })
        }

        // 广播消息更新通知
        broadcastMessage()

        res.status(200).json(messages[messageIndex])
      })
    } catch (parseErr) {
      console.error('解析消息失败:', parseErr)
      res.status(500).json({ error: '解析消息失败' })
    }
  })
})
