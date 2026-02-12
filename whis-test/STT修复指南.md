# STT服务问题修复指南

## 问题1：ffmpeg未安装

### 快速安装（使用winget）
```bash
winget install FFmpeg
```

### 手动安装
1. 下载地址：https://www.gyan.dev/ffmpeg/builds/
2. 下载 `ffmpeg-release-essentials.zip`
3. 解压到 `C:\ffmpeg`
4. 添加环境变量：
   ```
   C:\ffmpeg\bin
   ```
5. 验证安装：
   ```bash
   ffmpeg -version
   ```

---

## 问题2：CUDA库缺失

### 原因
faster-whisper尝试使用GPU加速，但CUDA未安装。

### 解决方案（CPU模式）

无需安装CUDA！STT服务已配置为自动回退到CPU模式。

但当前回退机制可能不完善。让我检查是否需要重启服务。

---

## 当前状态检查

请运行以下命令检查：
```bash
# 1. 检查ffmpeg
ffmpeg -version

# 2. 重启STT服务
# 关闭当前服务（Ctrl+C），然后重新启动
python stt_api_service.py

# 3. 查看启动日志，确认是否使用CPU模式
```

---

## 完整重启步骤

```bash
# 步骤1: 安装ffmpeg（如未安装）
winget install FFmpeg

# 步骤2: 关闭当前运行的STT服务（Ctrl+C）

# 步骤3: 重启所有服务
npm start
```

---

## 如果CPU模式仍然失败

如果仍然看到CUDA错误，可能需要：
1. 确保faster-whisper已正确安装
2. 检查Python环境

```bash
# 重新安装faster-whisper
pip install --upgrade faster-whisper

# 或者安装CPU版本
pip install faster-whisper
```

---

## 验证修复

启动服务后，查看日志应该显示：
```
加载模型: base
GPU加载失败，使用CPU模式
或
使用CPU模式
```

而不是：
```
Library cublas64_12.dll is not found or cannot be loaded
```
