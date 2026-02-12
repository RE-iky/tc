# CUDA配置诊断报告

## ✅ 已安装组件

| 组件 | 版本 | 状态 |
|------|------|------|
| NVIDIA CUDA 驱动 | 12.9.91 | ✓ 正常 |
| CUDA Toolkit | 13.1 (V13.1.115) | ✓ 正常 |
| Python | 3.14.3 | ✓ 正常 |
| CUDA编译器 (nvcc) | 13.1 | ✓ 正常 |
| cuBLAS库 | cublas64_13.dll | ✓ 存在 |

## ❌ 问题分析

### 错误信息
```
Library cublas64_12.dll is not found or cannot be loaded
```

### 根本原因
faster-whisper依赖的是**CUDA 12.x**版本的库，但你的系统安装的是**CUDA 13.1**。

**版本不匹配：**
- 需要：`cublas64_12.dll` (CUDA 12.x)
- 实际：`cublas64_13.dll` (CUDA 13.1)

### 为什么会这样？
faster-whisper使用的底层库（CTranslate2）在编译时链接了CUDA 12.x，因此运行时需要CUDA 12.x的动态链接库。

## 🔧 解决方案

### 方案1：使用OpenAI API（推荐，已配置）✓

**优点：**
- 无需处理CUDA版本问题
- 识别质量更高
- 无需本地GPU资源

**配置：**
```env
USE_LOCAL_STT=false
OPENAI_API_KEY=sk-proj-... (已配置)
```

**状态：** ✅ 已完成配置

**下一步：** 重启后端服务即可使用

---

### 方案2：安装CUDA 12.x Toolkit（保留GPU加速）

如果你想保留本地GPU加速能力，可以安装CUDA 12.x（可与13.1共存）。

**步骤：**

1. **下载CUDA 12.6 Toolkit**
   - 访问：https://developer.nvidia.com/cuda-12-6-0-download-archive
   - 选择：Windows > x86_64 > 11 > exe (local)

2. **安装选项**
   - 选择"自定义安装"
   - 只安装运行时库（Runtime）
   - 不要卸载CUDA 13.1

3. **验证安装**
   ```bash
   where cublas64_12.dll
   ```
   应该显示：`C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.6\bin\cublas64_12.dll`

4. **修改配置**
   ```env
   USE_LOCAL_STT=true
   ```

5. **重启STT服务**
   ```bash
   python stt_api_service.py
   ```

**注意：** CUDA 12.x和13.1可以共存，不会冲突。

---

### 方案3：使用CPU模式（不推荐）

修改`stt_api_service.py`强制使用CPU：

```python
models[model_size] = WhisperModel(
    model_size,
    device="cpu",
    compute_type="int8"
)
```

**缺点：** 识别速度会慢很多

## 📊 当前配置状态

```
✓ CUDA驱动已安装
✓ CUDA Toolkit 13.1已安装
✓ OpenAI API已配置
✓ USE_LOCAL_STT=false (使用云端API)
```

## 🚀 推荐操作

**立即可用：**
```bash
# 重启后端服务以应用OpenAI API配置
npm start
```

**如需本地GPU加速：**
1. 安装CUDA 12.6 Toolkit
2. 修改USE_LOCAL_STT=true
3. 重启STT服务

## 📝 总结

你的CUDA环境配置正确，只是版本不匹配。已选择使用OpenAI API方案，无需修改CUDA配置。重启服务即可正常使用字幕生成功能。
