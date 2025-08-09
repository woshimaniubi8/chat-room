// 文件名: script.js
// 描述：前端逻辑
// 版本: 1.0.0
// 作者: woshimaniubi8
// 日期: 2025-08-09

const SRC_URL = '' // 留空表示同
const WS_URL = '' // 留空表示同
const electron_build = false // 是否为electron构建
//以上地址electron必须填写，网页端可看实际情况填写

///////////////////////////////////////////////////////
// 你好，我是孩子家长，我看看到了孩子受气，
// 我也是无意间 看到你们聊天的记录的，你说这话是什么意思？
// 说出的话我 都不敢想。你是学生还是什么样的人？
// 还有出门也这样说话吗？我真的不敢想象你的家长，难道就不管你吗
///////////////////////////////////////////////////////
// 用户配置
const usernamea = localStorage.getItem('username') || Math.random().toString(36).substring(2, 15)
let userConfig = {
  username: usernamea,
  avatar: localStorage.getItem('avatar') || `https://ui-avatars.com/api/?name=${usernamea}&background=random`,
}
localStorage.setItem('username', usernamea)
localStorage.setItem('avatar', localStorage.getItem('avatar') || `https://ui-avatars.com/api/?name=${usernamea}&background=random`)
let attachments = []
let autoChange = true
let lastContent = []
let NoticeContent = '欢迎加入聊天室！你可以点击右上角的设置按钮自定义你的用户名和头像。<br><h4 class="sys_msg">信息支持html标签哦~</h4>'

const userInput = document.getElementById('set-username')
const avatarInput = document.getElementById('set-avatar')
const loadD = document.getElementById('loading-screen')
const avatarPreview = document.getElementById('avatar-preview')
const fileInput = document.getElementById('file-input')
const fujianPreview = document.getElementById('attachments-preview')
const avatarFileInput = document.getElementById('avatar-file-input')
const avatarFileName = document.getElementById('avatar-file-name')

function initUserConfig() {
  document.getElementById('username').textContent = userConfig.username
  document.getElementById('user-avatar').src = userConfig.avatar
  avatarPreview.src = userConfig.avatar
  userInput.value = userConfig.username
  avatarInput.value = userConfig.avatar
}

function displayMessage(message, isSelf = false) {
  const messagebbb = document.createElement('div')
  messagebbb.classList.add('message')
  messagebbb.classList.add(isSelf ? 'self' : 'other')

  const date = new Date(message.timestamp)
  const timeString = date.toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  if (message.avatar.startsWith('http')) {
    message.avatar = message.avatar
  } else {
    message.avatar = SRC_URL + message.avatar
  }
  // 消息内容HTML
  let msgContent = `
            <img class="avatar" src="${message.avatar}" alt="${message.username}">
            <div class="message-content">
                <div class="message-header">
                    <span class="sender">${isSelf ? '你' : message.username}</span>
                </div>
        `

  // 文本内容
  if (message.text) {
    msgContent += `<div class="message-text">${message.text}</div>`
  }

  // 附件
  if (message.attachments && message.attachments.length > 0) {
    msgContent += `<div class="message-attachments">`

    message.attachments.forEach((attachment) => {
      if (attachment.type === 'image') {
        msgContent += `
                        <div class="message-attachment">
                            <img src="${SRC_URL}${attachment.url}" alt="${attachment.name}" onclick="window.open('${SRC_URL}${attachment.url}', '_blank')">
                        </div>
                    `
      } else if (attachment.type === 'video') {
        msgContent += `
                        <div class="message-attachment">
                            <video width="100%" src="${SRC_URL}${attachment.url}" controls>
                        </div>
                    `
      } else if (attachment.type === 'audio') {
        msgContent += `
                        <div class="message-attachment">
                            <audio src="${SRC_URL}${attachment.url}"controls style="max-width: 200px; max-height: 230px; border-radius: 5px; margin-right: 10px;"></audio>
                        </div>
                    `
      } else {
        const fileType = getFileTypeIcon(attachment.name.split('.').pop())
        msgContent += `
                        <div class="message-attachment">
                            <a href="${SRC_URL}${attachment.url}" target="_blank" class="file-preview">
                                <i class="fas fa-${fileType.icon}" style="color: ${fileType.color};font-size:30px;"></i>
                                <p>${attachment.name}</p>
                            </a>
                        </div>
                    `
      }
    })

    msgContent += `</div>`
  }

  // 时间
  msgContent += `
                <div class="message-time">${timeString}</div>
            </div>
        `

  messagebbb.innerHTML = msgContent
  const messagesContainer = document.getElementById('messages-container')
  messagesContainer.appendChild(messagebbb)
  messagesContainer.scrollTop = messagesContainer.scrollHeight
}

// 获取文件类型图标
function getFileTypeIcon(ext) {
  //叼你妈的，一个个添加太死人了
  const icons = {
    pdf: { icon: 'file-pdf', color: '#e74c3c' },
    zip: { icon: 'file-archive', color: '#9b59b6' },
    apk: { icon: 'file-archive', color: '#9b59b6' },
    '7z': { icon: 'file-archive', color: '#9b59b6' },
    rar: { icon: 'file-archive', color: '#9b59b6' },
    jar: { icon: 'file-archive', color: '#9b59b6' },
    mp3: { icon: 'file-audio', color: '#1abc9c' },
    wav: { icon: 'file-audio', color: '#1abc9c' },
    flac: { icon: 'file-audio', color: '#1abc9c' },
    aac: { icon: 'file-audio', color: '#1abc9c' },
    m3u: { icon: 'file-audio', color: '#1abc9c' },
    mp4: { icon: 'file-video', color: '#d35400' },
    mov: { icon: 'file-video', color: '#d35400' },
    mkv: { icon: 'file-video', color: '#d35400' },
    m3u8: { icon: 'file-video', color: '#d35400' },
    flv: { icon: 'file-video', color: '#d35400' },
    avi: { icon: 'file-video', color: '#d35400' },
    txt: { icon: 'file-alt', color: '#7f8c8d' },
    md: { icon: 'file-alt', color: '#7f8c8d' },
    csv: { icon: 'file-csv', color: '#f39c12' },
    json: { icon: 'file-code', color: '#8e44ad' },
    c: { icon: 'file-code', color: '#8e44ad' },
    cpp: { icon: 'file-code', color: '#8e44ad' },
    h: { icon: 'file-code', color: '#8e44ad' },
    html: { icon: 'file-code', color: '#8e44ad' },
    htm: { icon: 'file-code', color: '#8e44ad' },
    js: { icon: 'file-code', color: '#8e44ad' },
    css: { icon: 'file-code', color: '#8e44ad' },
    go: { icon: 'file-code', color: '#8e44ad' },
    spec: { icon: 'file-code', color: '#8e44ad' },
    py: { icon: 'file-code', color: '#8e44ad' },
    rb: { icon: 'file-code', color: '#8e44ad' },
    cmd: { icon: 'file-code', color: '#8e44ad' },
    ps1: { icon: 'file-code', color: '#8e44ad' },
    bat: { icon: 'file-code', color: '#8e44ad' },
    sh: { icon: 'file-code', color: '#8e44ad' },
    java: { icon: 'file-code', color: '#8e44ad' },
    xml: { icon: 'file-xml', color: '#8e44ad' },
    doc: { icon: 'file-word', color: '#2488e6ff' },
    docx: { icon: 'file-word', color: '#2488e6ff' },
    docm: { icon: 'file-word', color: '#2488e6ff' },
    ppt: { icon: 'file-ppt', color: '#e63124ff' },
    pptx: { icon: 'file-ppt', color: '#e63124ff' },
    pptm: { icon: 'file-ppt', color: '#e63124ff' },
    xls: { icon: 'file-excel', color: '#24e69cff' },
    xlsx: { icon: 'file-excel', color: '#24e69cff' },
    xlsm: { icon: 'file-excel', color: '#24e69cff' },
    ttf: { icon: 'font', color: '#eff31cff' },
    woff: { icon: 'font', color: '#eff31cff' },
    woff2: { icon: 'font', color: '#eff31cff' },
    default: { icon: 'file', color: '#95a5a6' },
  }

  return icons[ext.toLowerCase()] || icons.default
}
let old_message
// 获取消息
let lattttMessages = [] // 存储上次获取的消息数组

async function fetchMessages() {
  try {
    const response = await fetch(`${SRC_URL}/messages`)
    if (!response.ok) throw new Error('获取消息失败')

    const newMessages = await response.json()

    // 检测新消息
    const addedMessages = newMessages.filter(
      (newMsg) =>
        !lattttMessages.some(
          (oldMsg) => oldMsg.id === newMsg.id // 假设消息有唯一ID
        )
    )

    // 仅渲染新增消息
    addedMessages.forEach((message) => {
      const isSelf = message.username === userConfig.username
      displayMessage(message, isSelf)
      console.log('渲染新消息', message)
    })

    // 更新消息记录
    lattttMessages = newMessages
  } catch (error) {
    toastr.error('获取消息失败:' + error.message)
  }
}

// 处理文件选择
function handleFileSelect(e) {
  const files = Array.from(e.target.files)
  if (files.length === 0) return

  files.forEach((file) => {
    const reader = new FileReader()

    reader.onload = function (e) {
      const attachment = {
        file: file,
        dataUrl: e.target.result,
        type: file.type.split('/')[0],
        name: file.name,
      }

      attachments.push(attachment)
      renderfujianPreview(attachment)
    }

    reader.readAsDataURL(file)
  })

  fileInput.value = ''
}

// 渲染附件预览
function renderfujianPreview(attachment) {
  const item = document.createElement('div')
  item.className = 'attachment-item'

  if (attachment.type === 'image') {
    item.innerHTML = `
                <img src="${attachment.dataUrl}" alt="${attachment.name}">
                <button class="remove-attachment">&times;</button>
            `
  } else {
    const fileType = getFileTypeIcon(attachment.name.split('.').pop())

    item.innerHTML = `
                <div class="file-icon">
                    <i class="fas fa-${fileType.icon}"></i>
                    <div class="file-name">${attachment.name}</div>
                </div>
                <button class="remove-attachment">&times;</button>
            `
  }

  item.querySelector('.remove-attachment').addEventListener('click', () => {
    attachments = attachments.filter((a) => a !== attachment)
    item.remove()
  })

  fujianPreview.appendChild(item)
}
const messageInput = document.getElementById('message-input')
// 发送消息
async function sendMessage() {
  const text = messageInput.value.trim()
  if (!text && attachments.length === 0) return

  // 上传附件
  const attachmentUrls = []
  if (attachments.length > 0) {
    try {
      loadD.style.display = 'flex' // 显示加载屏幕
      for (const attachment of attachments) {
        const formData = new FormData()
        // 对文件名进行编码
        const encodedName = encodeURIComponent(attachment.file.name)
        formData.append('file', attachment.file, encodedName)

        const response = await fetch(`${SRC_URL}/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('附件上传失败')

        const result = await response.json()
        // 注意：这里上传接口返回的是数组，但我们是一个一个上传的，所以取第一个
        if (result && result.length > 0) {
          attachmentUrls.push(result[0])
        }
      }
    } catch (error) {
      console.error('附件上传失败:', error)
      toastr.error('部分附件上传失败，请检查文件大小 ≤ 2000MB')
      loadD.style.display = 'none' // 隐藏加载屏幕
      return
    }

    loadD.style.display = 'none' // 隐藏加载屏幕
  }

  const message = {
    username: userConfig.username,
    avatar: userConfig.avatar,
    text: text,
    attachments: attachmentUrls,
    timestamp: new Date().toISOString(),
    id: Math.random().toString(36).substring(2, 30) + Date.now(), // msgID
  }

  try {
    const response = await fetch(`${SRC_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (response.ok) {
      messageInput.value = ''
      attachments = []
      fujianPreview.innerHTML = ''
      //  displayMessage(message, true)
    }
  } catch (error) {
    toastr.error('发送消息失败:' + error.message)
  }
}
const settingsM = document.getElementById('settings-modal')
// 保存设置
async function saveSettings() {
  const newUsername = userInput.value.trim() || '用户'
  let newAvatar = avatarInput.value.trim()

  // 如果选择了头像文件，则上传
  if (avatarFileInput.files.length > 0) {
    //
    loadD.style.display = 'flex' // 隐藏加载屏幕
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFileInput.files[0])

      const response = await fetch(`${SRC_URL}/upload-avatar`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('头像上传失败')

      const result = await response.json()
      newAvatar = SRC_URL + result.url
    } catch (error) {
      loadD.style.display = 'none' // 隐藏加载屏幕
      console.error('头像上传失败:', error)
      toastr.error('头像上传失败，使用默认头像')
      newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(newUsername)}&background=random`
    }
  } else if (!newAvatar) {
    loadD.style.display = 'none' // 隐藏加载屏幕
    newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(newUsername)}&background=random`
  }
  loadD.style.display = 'none' // 隐藏加载屏幕
  // 更新配置
  userConfig.username = newUsername
  userConfig.avatar = newAvatar
  localStorage.setItem('username', newUsername)
  localStorage.setItem('avatar', newAvatar)

  document.getElementById('username').textContent = newUsername
  document.getElementById('user-avatar').src = newAvatar
  avatarPreview.src = newAvatar
  fetchOnlineUsers()
  settingsM.style.display = 'none'
  toastr.success('设置已保存')
}

// 获取在线用户
async function fetchOnlineUsers() {
  try {
    const response = await fetch(`${SRC_URL}/online-users`)
    if (!response.ok) throw new Error('获取在线用户失败')

    const users = await response.json()
    renderOnlineUsers(users)
  } catch (error) {
    console.error('获取在线用户失败:', error)
    toastr.error('获取在线用户失败')
  }
}

async function fetchNoticeContent() {
  toastr.info('新公告')
  try {
    const response = await fetch(`${SRC_URL}/notice`)
    if (!response.ok) throw new Error('获取公告失败')
    const resp = await response.json()
    NoticeContent = resp.text || '欢迎加入聊天室！你可以点击右上角的设置按钮自定义你的用户名和头像。<br><h4 class="sys_msg">信息支持html标签哦~</h4>'
    NoticeTime = resp.time
    const welcomeMessage = {
      username: '系统',
      avatar: 'https://ui-avatars.com/api/?name=System&background=0D8ABC',
      text: '<span class="gg">[公告] </span>' + NoticeContent,
      timestamp: NoticeTime,
      id: 'sys_msg_0',
    }
    displayMessage(welcomeMessage)
  } catch (error) {
    console.log('获取公告失败:', error)
    toastr.error('获取公告失败')
    const welcomeMessage = {
      username: '系统',
      avatar: 'https://ui-avatars.com/api/?name=System&background=0D8ABC',
      text: '<span class="gg">[公告] </span>' + NoticeContent,
      timestamp: NoticeTime,
      id: 'sys_msg_0',
    }
    displayMessage(welcomeMessage)
  }
}

// 渲染在线用户
function renderOnlineUsers(users) {
  const userList = document.querySelector('.user-list')
  userList.innerHTML = ''

  // 添加当前用户
  const currentUserItem = document.createElement('div')
  currentUserItem.className = 'user-item'
  if (userConfig.avatar.startsWith('http')) {
    avatarUrl = userConfig.avatar
  } else {
    avatarUrl = SRC_URL + userConfig.avatar
  }
  currentUserItem.innerHTML = `
            <img src="${userConfig.avatar}" alt="${userConfig.username}">
            <span>${userConfig.username} (我)</span>
        `
  userList.appendChild(currentUserItem)

  // 添加其他在线用户
  users
    .filter((user) => user.username !== userConfig.username)
    .forEach((user) => {
      if (user.avatar.startsWith('http')) {
        avatar1Url = user.avatar
      } else {
        avatar1Url = SRC_URL + user.avatar
      }
      const userItem = document.createElement('div')
      userItem.className = 'user-item'
      userItem.innerHTML = `
                    <img src="${user.avatar}" alt="${user.username}">
                    <span>${user.username}</span>
                `
      userList.appendChild(userItem)
    })
}

// WebSocket连接
function setupWebSocket() {
  let protocol = 'ws:' // 默认使用ws协议
  if (electron_build) {
    if (SRC_URL.startsWith('https')) {
      protocol = 'wss:' // 使用wss协议
    }
  } else {
    protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  }
  const wsurl = WS_URL ? WS_URL : window.location.host
  const ws = new WebSocket(`${protocol}//${wsurl}`)

  ws.onopen = () => {
    console.log('WebSocket连接已建立')
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'new-message') {
      fetchMessages()
    } else if (data.type === 'new-gg') {
      fetchNoticeContent()
    }
  }

  ws.onerror = (error) => {
    console.error('WebSocket错误:', error)
    toastr.error('WebSocket连接失败，请检查网络或服务器状态')
    // 尝试重新连接
    setTimeout(setupWebSocket, 3000)
  }

  ws.onclose = () => {
    console.log('WebSocket连接关闭，尝试重新连接...')
    toastr.warning('WebSocket连接已关闭，尝试重新连接...')
    setTimeout(setupWebSocket, 3000)
  }

  return ws
}

document.getElementById('send-btn').addEventListener('click', sendMessage)

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage()
  }
})

document.getElementById('settings-btn').addEventListener('click', () => {
  settingsM.style.display = 'flex'
  // lastContent = avatarInput.value.trim()
  avatarInput.value = userConfig.avatar
  userInput.value = userConfig.username
  lastContent.push(userInput.value.trim())
  lastContent.push(avatarInput.value.trim())
  if (lastContent[1] != `https://ui-avatars.com/api/?name=${lastContent[0]}&background=random` && lastContent[1] != '') {
    autoChange = false
  }
})

document.querySelector('.close-btn').addEventListener('click', () => {
  settingsM.style.display = 'none'
})

document.getElementById('save-settings').addEventListener('click', saveSettings)

avatarInput.addEventListener('input', () => {
  autoChange = false
  avatarPreview.src = avatarInput.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInput.value || 'User')}&background=random`
})
userInput.addEventListener('input', () => {
  if (autoChange || lastContent[1] === '') {
    avatarInput.value = `https://ui-avatars.com/api/?name=${encodeURIComponent(userInput.value || 'User')}&background=random`
  }
  avatarPreview.src = avatarInput.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInput.value || 'User')}&background=random`
})
fileInput.addEventListener('change', handleFileSelect)

avatarFileInput.addEventListener('change', function () {
  if (this.files.length > 0) {
    const file = this.files[0]
    avatarFileName.textContent = file.name

    const reader = new FileReader()
    reader.onload = function (e) {
      avatarPreview.src = e.target.result
    }
    reader.readAsDataURL(file)
  }
})

// 初始化
initUserConfig()
fetchMessages()
fetchNoticeContent()
fetchOnlineUsers()
setupWebSocket()

// 每30秒更新在线用户
setInterval(fetchOnlineUsers, 30000)

///////////////////////////////////////////////////////
//
// 屑王文星不要闹了😡，你让你的群U们都跟着你丢脸😡，
// 从现在开始，网费清零😡，什么流量都没有，什么游戏都不许玩😡
//
///////////////////////////////////////////////////////
