# 功能状态文档模板

> 本模板用于标准化记录功能的实现状态、技术细节和待优化项。

---

## 使用说明

1. 复制本模板内容
2. 替换所有 `[占位符]` 为实际内容
3. 删除不适用的可选章节
4. 保持Markdown格式的一致性

---

## 模板内容

### [功能编号]. [功能名称]

**实现状态**: [详细状态描述]

**实现位置**:
- 后端: [文件路径，例如: `server/src/controllers/authController.ts`]
- 前端: [文件路径，例如: `src/pages/Login.tsx`]
- 配置: [配置文件，例如: `server/.env`]

**功能描述**:
[功能的详细说明，包括功能目标、用户场景和预期行为]

**技术实现**:
[关键代码片段或技术要点]

```typescript
// 示例代码
function exampleFunction() {
  // 实现细节
}
```

**环境配置**:
[所需的环境变量或配置]

```bash
# 示例环境变量
API_KEY=your_api_key
DATABASE_URL=your_database_url
```

**激活步骤**:
[如何启用该功能]

1. 步骤1
2. 步骤2
3. 步骤3

**待优化项**:
- [ ] 优化项1
- [ ] 优化项2
- [ ] 优化项3

---

## 使用示例

### 2.1 用户登录功能

**实现状态**: 基础登录功能已实现，支持用户名/密码认证

**实现位置**:
- 后端: `server/src/controllers/authController.ts`
- 前端: `src/pages/Login.tsx`, `src/store/auth.ts`
- 配置: `server/.env` (JWT_SECRET)

**功能描述**:
用户可以通过用户名和密码登录系统。登录成功后，系统生成JWT令牌并存储在客户端，用于后续API请求的身份验证。支持"记住我"功能，可以延长会话有效期。

**技术实现**:
- 使用bcrypt进行密码哈希验证
- JWT令牌用于会话管理
- Zustand存储认证状态
- React Router保护需要认证的路由

```typescript
// 登录控制器示例
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);
  
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  res.json({ token, user: { id: user.id, username: user.username } });
};
```

**环境配置**:
```bash
# 后端 .env 文件
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=7d
```

**激活步骤**:
1. 在 `server/.env` 文件中配置 `JWT_SECRET`
2. 启动后端服务: `cd server && npm run dev`
3. 启动前端服务: `npm run dev`
4. 访问 `http://localhost:3000/login` 进行测试

**待优化项**:
- [ ] 添加双因素认证(2FA)支持
- [ ] 实现密码强度验证
- [ ] 添加登录失败次数限制
- [ ] 支持第三方OAuth登录(Google, GitHub)
- [ ] 改进错误提示的无障碍性

---

## 字段说明

### 必需字段

- **功能编号**: 唯一标识符，建议使用层级编号(如: 2.1, 2.1.1)
- **功能名称**: 简洁明确的功能名称
- **实现状态**: 当前实现的详细状态描述
- **实现位置**: 相关代码文件的路径
- **功能描述**: 功能的详细说明

### 可选字段

- **技术实现**: 关键技术细节和代码示例
- **环境配置**: 所需的环境变量或配置
- **激活步骤**: 启用功能的具体步骤
- **待优化项**: 未来改进方向

---

## 状态标识参考

**功能状态**:
- ✅ 已实现: 功能完全可用
- 🔄 部分完成: 部分功能可用，部分待实现
- ❌ 待实现: 尚未开始实现

**优先级标识**:
- 🔥 高: 核心功能，必须实现
- ⭐ 中: 重要功能，应该实现
- 💡 低: 增强功能，可选实现

---

## 最佳实践

1. **保持更新**: 功能实现后及时更新文档
2. **详细描述**: 提供足够的技术细节便于维护
3. **代码示例**: 包含关键代码片段帮助理解
4. **路径准确**: 确保文件路径正确且最新
5. **待优化项**: 记录已知的改进方向
6. **无障碍性**: 考虑功能的无障碍性实现

---

**模板版本**: v1.0  
**创建日期**: 2026-02-11  
**最后更新**: 2026-02-11
