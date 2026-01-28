# ☁️ Cloudflare DNS 配置步骤（For Resend）

**域名**：iylforum.com
**预计时间**：10-15 分钟（含 DNS 生效）

---

## 第一步：在 Resend 添加域名（3 分钟）

### 1.1 登录 Resend
1. 打开：https://resend.com/login
2. 输入邮箱：`pyunqi@gmail.com`
3. 输入密码（你注册时设置的密码）
4. 点击 **"Sign In"**

### 1.2 进入 Domains 页面
1. 登录后，在左侧菜单找到 **"Domains"**
2. 点击进入

### 1.3 添加域名
1. 点击右上角 **"Add Domain"** 按钮
2. 在输入框中输入：`iylforum.com`
3. 点击 **"Add"** 或 **"Continue"**

### 1.4 复制 DNS 记录
添加后，Resend 会显示需要添加的 DNS 记录。**不要关闭这个页面！**

你应该能看到类似这样的记录：

**📋 SPF 记录**
```
Type: TXT
Name: @ 或 iylforum.com
Value: v=spf1 include:resend.com ~all
```

**📋 DKIM 记录**（最重要）
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCS... （一长串字符）
```

**重要**：保持这个页面打开，一会儿要复制这些值！

---

## 第二步：在 Cloudflare 添加 DNS 记录（5 分钟）

### 2.1 登录 Cloudflare
1. 打开新标签页：https://dash.cloudflare.com
2. 登录你的 Cloudflare 账号

### 2.2 选择域名
1. 在主页面找到 **iylforum.com**
2. 点击进入域名管理页面

### 2.3 进入 DNS 设置
1. 在左侧菜单或顶部标签找到 **"DNS"** 或 **"DNS Records"**
2. 点击进入（会看到现有的 DNS 记录列表）

### 2.4 添加 SPF 记录

1. 点击 **"Add record"** 按钮
2. 填写以下信息：
   - **Type**: 选择 `TXT`
   - **Name**: 输入 `@` （或者 `iylforum.com`，都可以）
   - **Content**: 输入 `v=spf1 include:resend.com ~all`
   - **TTL**: 保持 `Auto` 或选择 `1 min`
   - **Proxy status**: **重要！关闭橙色云朵**（点击橙色云图标变成灰色，显示 "DNS only"）
3. 点击 **"Save"** 保存

### 2.5 添加 DKIM 记录（最重要！）

1. 再次点击 **"Add record"** 按钮
2. 填写以下信息：
   - **Type**: 选择 `TXT`
   - **Name**: 输入 `resend._domainkey`
   - **Content**:
     - **切换到 Resend 页面**
     - 找到 DKIM 记录的 Value（很长的一串）
     - **全部复制**
     - **粘贴**到 Cloudflare 的 Content 框
   - **TTL**: 保持 `Auto` 或选择 `1 min`
   - **Proxy status**: **关闭橙色云朵**（DNS only）
3. 点击 **"Save"** 保存

### 2.6 添加 DMARC 记录（推荐但可选）

1. 再次点击 **"Add record"**
2. 填写：
   - **Type**: `TXT`
   - **Name**: `_dmarc`
   - **Content**: `v=DMARC1; p=none`
   - **TTL**: `Auto`
   - **Proxy status**: **DNS only**（关闭橙色云）
3. 点击 **"Save"**

---

## 第三步：验证 DNS 记录（2-10 分钟）

### 3.1 检查 Cloudflare 中的记录

在 Cloudflare DNS Records 页面，你应该能看到刚添加的记录：

✅ **应该有这些记录：**
- `TXT` | `@` 或 `iylforum.com` | `v=spf1 include:resend.com ~all`
- `TXT` | `resend._domainkey` | `p=MIGfMA0GCS...`（很长）
- `TXT` | `_dmarc` | `v=DMARC1; p=none`

⚠️ **确保所有记录的橙色云朵都是灰色的**（DNS only）

### 3.2 等待 DNS 生效

Cloudflare DNS 通常 **2-5 分钟**生效，最多 10 分钟。

**建议等待 5 分钟**再进行验证。

### 3.3 在 Resend 验证域名

1. 切换回 Resend 的 Domains 页面
2. 找到 `iylforum.com`
3. 点击 **"Verify"** 或 **"Verify DNS Records"** 按钮
4. 等待几秒

**验证成功的标志：**
- ✅ 域名状态变成 **"Verified"** 或显示绿色勾号
- ✅ 所有 DNS 记录旁边都有绿色勾号

**如果验证失败：**
- ⏰ 可能 DNS 还没完全生效，等待 5 分钟后再试
- 🔍 检查 DNS 记录是否正确（特别是 DKIM 那个很长的字符串）
- 💡 使用在线工具检查（见下方）

---

## 第四步：检查 DNS 是否生效（可选但推荐）

如果 Resend 验证失败，使用这个工具检查：

### 检查 SPF 记录
1. 打开：https://mxtoolbox.com/TXTLookup.aspx
2. 输入：`iylforum.com`
3. 点击 **"TXT Lookup"**
4. 应该能看到：`v=spf1 include:resend.com ~all`

### 检查 DKIM 记录
1. 打开：https://mxtoolbox.com/TXTLookup.aspx
2. 输入：`resend._domainkey.iylforum.com`
3. 点击 **"TXT Lookup"**
4. 应该能看到一长串以 `p=MIGf...` 开头的字符串

**如果能查到 = DNS 已生效！**
**如果查不到 = 再等 5 分钟**

---

## 第五步：测试发送邮件（可选）

验证成功后，可以在 Resend 测试发送：

1. 在 Resend 左侧菜单找到 **"Emails"** 或点击 **"Send Test Email"**
2. 填写：
   - **From**: `noreply@iylforum.com`
   - **To**: `pyunqi@gmail.com`
   - **Subject**: `Resend 测试邮件`
   - **Body**:
     ```
     这是一封测试邮件。

     如果你收到这封邮件，说明 Resend 配置成功！

     来自：ForumFiles
     ```
3. 点击 **"Send"** 发送
4. 检查你的 Gmail 收件箱（可能在垃圾邮件）

**收到邮件 = 配置完美！** 🎉

---

## ✅ 完成检查清单

完成后检查：

- [ ] Resend 中添加了域名 iylforum.com
- [ ] Cloudflare 添加了 SPF 记录（@ 或 iylforum.com）
- [ ] Cloudflare 添加了 DKIM 记录（resend._domainkey）
- [ ] Cloudflare 添加了 DMARC 记录（_dmarc）
- [ ] 所有记录的 Proxy status 都是 "DNS only"（灰色云）
- [ ] Resend 域名状态显示 "Verified" ✅
- [ ] （可选）成功发送测试邮件到 Gmail

**全部打勾 = 域名配置完成！** 🎊

---

## 🎯 域名配置成功后

恭喜！现在可以开始部署了：

📖 **打开** `开始部署.md` 文件，开始 Zeabur 部署流程！

你的邮件配置：
```
SMTP_FROM=ForumFiles <noreply@iylforum.com>
```

用户收到的验证码和通知邮件都会显示这个发件人！

---

## ❓ 常见问题

### Q1: Cloudflare 中找不到"添加记录"按钮？

**答**：
- 确保你在 "DNS" 或 "DNS Records" 页面
- 按钮可能叫 "Add record" 或 "+ Add"
- 通常在页面顶部或记录列表上方

### Q2: 添加 DKIM 记录时提示"内容太长"？

**答**：
- Cloudflare 支持最多 2048 字符，Resend 的 DKIM 不会超过
- 确保没有复制多余的空格或换行
- 尝试手动粘贴，不要用浏览器自动填充

### Q3: 为什么要关闭"橙色云朵"（Proxy）？

**答**：
- TXT 记录（SPF、DKIM、DMARC）必须直接解析
- 如果开启 Cloudflare 代理，邮件服务器无法读取这些记录
- 必须设置为 "DNS only"（灰色云）

### Q4: 等了很久 Resend 还是验证失败？

**答**：
1. 用在线工具检查 DNS 是否生效（见上方"第四步"）
2. 确认 Cloudflare 中的记录和 Resend 要求的完全一致
3. 确认橙色云朵已关闭
4. 如果都正确但还是失败，截图给我看

### Q5: 可以不添加 DMARC 记录吗？

**答**：
- 可以，DMARC 是可选的
- 但添加 DMARC 可以提高邮件送达率
- 建议添加，只需要 1 分钟

---

## 🆘 需要帮助？

配置过程中遇到问题：
- 📸 截图 Resend 的 Domains 页面
- 📸 截图 Cloudflare 的 DNS Records 页面
- 💬 告诉我具体哪一步卡住了

我会帮你解决！

---

**现在开始配置吧！有问题随时问我！** 🚀
