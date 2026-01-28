# 📧 Resend 域名配置指南

在部署之前，需要先在 Resend 中添加并验证你的域名 `iylforum.com`。

---

## 第一步：登录 Resend

1. 访问：https://resend.com/login
2. 用你注册的账号登录（邮箱：pyunqi@gmail.com）

---

## 第二步：添加域名

1. 登录后，在左侧菜单找到 **"Domains"**
2. 点击 **"Add Domain"** 按钮
3. 输入域名：`iylforum.com`
4. 点击 **"Add"** 或 **"Continue"**

---

## 第三步：获取 DNS 记录

添加域名后，Resend 会显示需要添加的 DNS 记录。通常包括：

### 1. SPF 记录（TXT 记录）
```
Type: TXT
Name: @ 或 iylforum.com
Value: v=spf1 include:resend.com ~all
```

### 2. DKIM 记录（TXT 记录）
```
Type: TXT
Name: resend._domainkey
Value: （Resend 会提供一个很长的字符串）
```

### 3. DMARC 记录（TXT 记录）- 可选但推荐
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none
```

**重要**：复制 Resend 显示的这些记录，不要关闭页面！

---

## 第四步：添加 DNS 记录到你的域名服务商

### 如果你的域名在 Cloudflare：

1. 登录 Cloudflare：https://dash.cloudflare.com
2. 选择域名：**iylforum.com**
3. 进入 **"DNS"** 或 **"DNS Records"**
4. 点击 **"Add record"**
5. 添加 Resend 提供的每一条记录：

**添加 SPF 记录：**
- Type: `TXT`
- Name: `@`
- Content: `v=spf1 include:resend.com ~all`
- TTL: `Auto`
- Proxy status: `DNS only`（关闭橙色云朵）
- 点击 **"Save"**

**添加 DKIM 记录：**
- Type: `TXT`
- Name: `resend._domainkey`
- Content: （粘贴 Resend 提供的长字符串）
- TTL: `Auto`
- Proxy status: `DNS only`
- 点击 **"Save"**

**添加 DMARC 记录（可选）：**
- Type: `TXT`
- Name: `_dmarc`
- Content: `v=DMARC1; p=none`
- TTL: `Auto`
- Proxy status: `DNS only`
- 点击 **"Save"**

### 如果你的域名在其他服务商：

根据你的域名服务商界面，添加相同的记录。常见服务商：
- **阿里云**：进入域名控制台 > 解析设置 > 添加记录
- **腾讯云**：进入域名解析 > 添加记录
- **GoDaddy**：进入 DNS Management > Add Record
- **Namecheap**：进入 Advanced DNS > Add New Record

---

## 第五步：验证域名

1. DNS 记录添加完成后，回到 Resend 页面
2. 点击 **"Verify"** 或 **"Verify DNS"** 按钮
3. 等待验证（通常几秒到几分钟）

**如果验证失败：**
- DNS 记录可能需要几分钟到几小时生效
- 等待 5-10 分钟后再点击 "Verify"
- 检查 DNS 记录是否正确添加

**验证成功标志：**
- 域名状态显示为 **"Verified"** 或绿色勾号 ✅
- 现在可以使用 `@iylforum.com` 发送邮件了

---

## 第六步：测试发送邮件（可选）

在 Resend 控制台测试发送：

1. 进入 **"Emails"** 或 **"Send Test Email"**
2. 填写：
   - From: `noreply@iylforum.com`
   - To: `pyunqi@gmail.com`（你的邮箱）
   - Subject: `测试邮件`
   - Body: `ForumFiles 邮件服务测试`
3. 点击 **"Send"**
4. 检查你的 Gmail 收件箱，应该能收到邮件

---

## ✅ 完成！

域名验证成功后，你的配置已经完成：

```bash
SMTP_FROM=ForumFiles <noreply@iylforum.com>
```

**现在可以开始部署了！** 📧

邮件功能将使用 `noreply@iylforum.com` 发送：
- 验证码邮件
- 文件分享通知

---

## 📋 配置检查清单

- [ ] 在 Resend 添加域名 iylforum.com
- [ ] 复制 Resend 提供的 DNS 记录
- [ ] 在域名服务商添加 SPF 记录
- [ ] 在域名服务商添加 DKIM 记录
- [ ] （可选）添加 DMARC 记录
- [ ] 在 Resend 点击 Verify 验证域名
- [ ] 域名状态显示 "Verified" ✅
- [ ] （可选）发送测试邮件验证

---

## ❓ 常见问题

### Q1: DNS 记录添加后一直验证失败？

**答**：DNS 记录生效需要时间（5分钟到24小时）。建议：
1. 等待 10-30 分钟
2. 使用在线工具检查 DNS：https://mxtoolbox.com/TXTLookup.aspx
3. 输入：`iylforum.com` 和 `resend._domainkey.iylforum.com` 分别检查

### Q2: 不想等待 DNS 生效，能先部署吗？

**答**：可以！先使用 Resend 的默认域名：
1. 暂时把 `SMTP_FROM` 改回 `onboarding@resend.dev`
2. 完成部署和测试
3. 域名验证成功后，再改回 `noreply@iylforum.com`
4. 在 Zeabur 更新环境变量即可

### Q3: 验证成功但发送邮件失败？

**答**：检查以下几点：
1. 确保域名状态是 "Verified"
2. 确保 `SMTP_FROM` 使用的是验证过的域名
3. 检查 API Key 是否有 "Sending access" 权限
4. 查看 Resend 控制台的 "Logs" 页面查看错误详情

---

## 🆘 需要帮助？

- 截图你的 Resend Domains 页面
- 告诉我你的域名服务商（Cloudflare/阿里云/其他）
- 复制错误信息给我

我会帮你解决！
