# Whisper STT 服务测试模块

这个文件夹包含用于测试本地Whisper STT服务的独立测试脚本。

## 文件说明

- `test_stt_service.py` - Python测试脚本，直接测试STT服务
- `test_audio.mp3` - 测试音频文件（需要自己提供）
- `output/` - 测试输出目录
- `README.md` - 本说明文件

## 使用方法

### 1. 准备测试音频
将一个短音频文件（建议10-30秒）放到此目录，命名为 `test_audio.mp3`

### 2. 运行测试
```bash
cd whisper-test
python test_stt_service.py
```

### 3. 查看结果
- 控制台会显示详细的测试过程
- 生成的字幕会保存到 `output/subtitle.srt`
- 测试报告会保存到 `output/test_report.txt`

## 测试内容

1. ✅ 检查STT服务是否运行
2. ✅ 测试健康检查端点
3. ✅ 上传音频文件并生成字幕
4. ✅ 验证字幕格式是否正确
5. ✅ 测量处理时间和性能

## 故障排查

### 问题1: 连接被拒绝
- 确保STT服务正在运行: `python stt_api_service.py`
- 检查端口9977是否被占用

### 问题2: 音频文件错误
- 确保音频文件格式正确（mp3/wav/m4a）
- 文件大小不要超过25MB

### 问题3: CUDA错误
- 检查CUDA是否正确安装
- 服务会自动降级到CPU模式
