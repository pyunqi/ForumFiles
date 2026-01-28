# ForumFiles Zeabur 部署指南

## 准备工作 ✅

- [x] 代码已推送到 GitHub: https://github.com/pyunqi/ForumFiles
- [x] JWT 密钥已生成
- [x] 环境变量配置文件已创建

---

## 第一步：获取 Gmail 应用专用密码

**为什么需要这个？**
Gmail 不允许直接使用普通密码发送邮件，需要创建专用密码。

**操作步骤：**

1. 访问：https://myaccount.google.com/apppasswords
2. 登录你的 Google 账号（pyunqi@gmail.com）
3. 如果提示"需要两步验证"：
   - 点击启用两步验证
   - 完成手机验证
4. 生成应用专用密码：
   - 选择应用：**邮件**
   - 选择设备：**其他（自定义名称）**
   - 输入名称：**ForumFiles**
   - 点击生成
5. **复制显示的16位密码**（格式：xxxx xxxx xxxx xxxx）
6. 保存这个密码，稍后需要填入 Zeabur 环境变量

**如果无法访问应用专用密码页面：**
可以使用下面推荐的免费 SMTP 服务（更简单）

---

## 第二步：在 Zeabur 创建项目

1. **登录 Zeabur**
   - 访问：https://dash.zeabur.com
   - 用 GitHub 账号登录

2. **创建新项目**
   - 点击右上角 **"New Project"**
   - 选择区域：**Hong Kong**（速度最快）
   - 项目名称：**forumfiles**

---

## 第三步：部署后端服务

### 3.1 添加后端服务

1. 在项目页面点击 **"Create Service"** 或 **"Add Service"**
2. 选择 **"Git"**
3. 选择仓库：**pyunqi/ForumFiles**
4. **重要**：选择 Root Directory 为 **`server`**
5. 点击 **"Deploy"**

### 3.2 添加持久化存储

1. 点击后端服务卡片
2. 找到 **"Volumes"** 或 **"持久化存储"** 标签
3. 点击 **"Add Volume"**
4. 配置：
   - **Mount Path**: `/data`
   - **Size**: 1 GB（或根据需要）
5. 保存

### 3.3 配置环境变量

1. 点击后端服务卡片
2. 找到 **"Variables"** 或 **"环境变量"** 标签
3. 打开文件 `ZEABUR_ENV_BACKEND.txt`（在项目根目录）
4. **复制所有内容**，粘贴到 Zeabur 的环境变量编辑器
5. **必须修改的地方：**
   - `SMTP_PASS`: 填入你在第一步获取的 Gmail 应用专用密码
   - `ALLOWED_ORIGINS`: 先不改（部署前端后再改）

6. 保存并等待服务重新部署

### 3.4 获取后端 URL

1. 部署完成后，在后端服务卡片上找到 **"Domains"** 或 **"域名"**
2. 复制 Zeabur 自动生成的域名，类似：
   ```
   https://forumfiles-server-xxxx.zeabur.app
   ```
3. **保存这个 URL**，下一步需要用

---

## 第四步：部署前端服务

### 4.1 添加前端服务

1. 回到项目页面，点击 **"Create Service"** 或 **"Add Service"**
2. 选择 **"Git"**
3. 选择仓库：**pyunqi/ForumFiles**
4. **重要**：选择 Root Directory 为 **`client`**
5. 点击 **"Deploy"**

### 4.2 配置环境变量

1. 点击前端服务卡片
2. 找到 **"Variables"** 或 **"环境变量"** 标签
3. 打开文件 `ZEABUR_ENV_FRONTEND.txt`
4. 修改 `VITE_API_URL` 为你在步骤 3.4 获取的**后端 URL**
5. 例如：
   ```
   VITE_API_URL=https://forumfiles-server-xxxx.zeabur.app
   ```
6. 保存并等待重新部署

### 4.3 获取前端 URL

1. 部署完成后，在前端服务卡片上找到域名
2. 复制前端 URL，类似：
   ```
   https://forumfiles-client-xxxx.zeabur.app
   ```
3. **保存这个 URL**

---

## 第五步：更新后端 CORS 配置

1. 回到**后端服务**
2. 进入 **"环境变量"** 设置
3. 找到 `ALLOWED_ORIGINS`
4. 修改为你的**前端 URL**：
   ```
   ALLOWED_ORIGINS=https://forumfiles-client-xxxx.zeabur.app
   ```
5. 保存（会自动重新部署）

---

## 第六步：测试验证

### 6.1 访问前端

1. 打开前端 URL
2. 应该能看到登录页面

### 6.2 管理员登录

使用以下凭据登录：
- **邮箱**: pyunqi@gmail.com
- **密码**: 62532356

**安全建议**：登录后立即在管理后台修改密码为更强的密码！

### 6.3 测试功能

- [ ] 上传文件
- [ ] 下载文件
- [ ] 删除文件
- [ ] 进入管理后台
- [ ] 生成公共下载链接
- [ ] 测试公共链接下载

---

## 常见问题

### 问题1：前端显示白屏

**解决方法：**
1. 检查前端的 `VITE_API_URL` 是否正确
2. 打开浏览器控制台（F12）查看错误
3. 检查后端是否成功部署

### 问题2：登录后提示 CORS 错误

**解决方法：**
1. 检查后端的 `ALLOWED_ORIGINS` 是否包含前端 URL
2. 确保 URL 没有末尾的斜杠
3. 保存后等待后端重新部署

### 问题3：无法发送验证码邮件

**解决方法：**
1. 检查 `SMTP_PASS` 是否正确填写了 Gmail 应用专用密码
2. 查看后端日志（点击服务 > Logs）
3. 或使用推荐的免费 SMTP 服务（见下方）

### 问题4：数据库或文件丢失

**解决方法：**
1. 确保添加了持久化存储卷
2. 挂载路径必须是 `/data`
3. 检查 `DATABASE_PATH` 和 `UPLOAD_DIR` 环境变量

---

## 推荐的免费 SMTP 服务（比 Gmail 更简单）

如果 Gmail 应用专用密码设置困难，推荐使用：

### 选项1：Resend（推荐）

**免费额度**: 3,000 封/月
**网址**: https://resend.com

**配置步骤：**
1. 注册账号
2. 验证域名（或使用他们的测试域名）
3. 创建 API Key
4. 环境变量修改为：
   ```
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASS=你的API_KEY
   SMTP_FROM=onboarding@resend.dev
   ```

### 选项2：Brevo（原 Sendinblue）

**免费额度**: 300 封/天
**网址**: https://www.brevo.com

**配置步骤：**
1. 注册账号
2. 进入 SMTP & API > SMTP
3. 创建 SMTP Key
4. 环境变量修改为：
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=你的登录邮箱
   SMTP_PASS=你的SMTP密钥
   SMTP_FROM=pyunqi@gmail.com
   ```

---

## 部署检查清单

完成以下所有项即部署成功：

- [ ] GitHub 代码已推送
- [ ] 后端服务已部署并运行
- [ ] 后端添加了持久化存储（/data）
- [ ] 后端环境变量已配置（包括 SMTP）
- [ ] 前端服务已部署并运行
- [ ] 前端 VITE_API_URL 指向后端
- [ ] 后端 ALLOWED_ORIGINS 包含前端 URL
- [ ] 能够访问前端页面
- [ ] 能够用管理员账号登录
- [ ] 文件上传/下载功能正常

---

## 需要帮助？

遇到问题随时告诉我：
1. 截图给我看
2. 告诉我具体哪一步出错
3. 复制错误信息给我

我会帮你解决！🚀
