#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试faster-whisper模型下载和语音识别功能
"""

from faster_whisper import WhisperModel
import os
import time

print("=" * 50)
print("开始测试faster-whisper")
print("=" * 50)

# 使用base模型（约300MB）
model_size = "base"
print(f"\n1. 加载模型: {model_size}")
print("首次运行会自动从Hugging Face下载模型...")
print("这可能需要几分钟，请耐心等待...")

start_time = time.time()

try:
    # 在CPU上运行，使用int8以减少内存使用
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    load_time = time.time() - start_time
    print(f"[OK] 模型加载成功！耗时: {load_time:.2f}秒")

    # 查找测试音频文件
    print("\n2. 查找测试音频文件...")
    test_audio = None
    audio_dir = r"C:\Users\reiko\Desktop\tc\server\src\controllers"

    if os.path.exists(audio_dir):
        for file in os.listdir(audio_dir):
            if file.startswith("temp_") and file.endswith(".mp3"):
                test_audio = os.path.join(audio_dir, file)
                break

    if test_audio and os.path.exists(test_audio):
        print(f"[OK] 找到测试音频: {test_audio}")
        file_size = os.path.getsize(test_audio) / (1024 * 1024)
        print(f"  文件大小: {file_size:.2f} MB")

        # 进行语音识别
        print("\n3. 开始语音识别...")
        start_time = time.time()

        segments, info = model.transcribe(
            test_audio,
            language="zh",
            beam_size=5,
            vad_filter=True
        )

        print(f"[OK] 识别完成！")
        print(f"  检测到的语言: {info.language} (置信度: {info.language_probability:.2f})")
        print(f"  音频时长: {info.duration:.2f}秒")

        # 输出识别结果
        print("\n4. 识别结果:")
        print("-" * 50)
        for segment in segments:
            print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")

        transcribe_time = time.time() - start_time
        print("-" * 50)
        print(f"识别耗时: {transcribe_time:.2f}秒")

    else:
        print("[错误] 未找到测试音频文件")
        print("  你可以手动指定音频文件路径进行测试")

    # 显示模型缓存位置
    print("\n5. 模型文件位置:")
    cache_dir = os.path.expanduser("~/.cache/huggingface/hub")
    if os.path.exists(cache_dir):
        print(f"  {cache_dir}")
        # 列出下载的模型
        for item in os.listdir(cache_dir):
            if "faster-whisper" in item.lower():
                model_path = os.path.join(cache_dir, item)
                print(f"  - {item}")

    print("\n" + "=" * 50)
    print("[OK] 测试完成！faster-whisper工作正常")
    print("=" * 50)

except Exception as e:
    print(f"\n[错误] 错误: {e}")
    import traceback
    traceback.print_exc()
