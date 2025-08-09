# chat-room
基于Node.js与HTML构建的在线公共聊天室

![PC](public/pc-screen.png)

![MOB](public/mob-screen.png)

## 入门



1.拉取存储库

```shell
git pull https://github.com/woshimaniubi8/chat-room
cd chat-room
```



2.安装运行环境

Ubuntu/Debian :

```shell
sudo apt update
sudo apt install npm nodejs
npm i
```



3.修改运行参数

`script.js` :

修改 `SRC_URL` 和 `WS_URL`

```javascript
// 文件名: script.js
// 描述：前端逻辑
// 版本: 1.0.0
// 作者: woshimaniubi8
// 日期: 2025-08-09

const SRC_URL = '' // 留空表示同
const WS_URL = '' // 留空表示同
const electron_build = false // 是否为electron构建
//以上地址electron必须填写，网页端可看实际情况填写
...

```



`index.js` :

修改 `ENABLE_HTTPS` 和 `PORT`

若启用HTTPS，需配置SSL证书

```javascript
...
const WebSocket = require('ws') //第8行

const ENABLE_HTTPS = false // 是否使用ssl加密，需配置证书
const PORT = 3000 // 服务器端口

...
if (ENABLE_HTTPS) { //第16行 启用ssl需进行配置
  const pKey = fs.readFileSync('privkey.pem', 'utf8') // 私钥
  const cert = fs.readFileSync('fullchain.pem', 'utf8') // 证书
...
```



4.运行

```shell
npm run start
```

样例输出：

```shell
$ npm run start

> chat_room@1.0.0 start
> node index.js

服务器运行在 http://localhost:3000
```

根据终端输出在浏览器打开相应地址即可

在浏览器打开 `服务器地址\message_manage` 可进入信息管理界面





## 附加声明

背景图来源：[Nachoneko Wallpapers - Wallpaper Cave](https://wallpapercave.com/nachoneko-wallpapers)