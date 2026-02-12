#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成测试音频文件
使用TTS生成一段中文语音用于测试
"""

import subprocess
import sys

def generate_with_ffmpeg():
    """使用ffmpeg生成简单的测试音频"""
    print("使用ffmpeg生成5秒测试音频...")
    try:
        subprocess.run([
            'ffmpeg', '-f', 'lavfi', '-i', 
            'sine=frequency=1000:duration=5', 
            '-y', 'test_audio.mp3'
        ], check=True)
        print("✓ 测试音频生成成功: test_audio.mp3")
        return True
    except FileNotFoundError:
        print("✗ 未找到ffmpeg，请先安装ffmpeg")
        return False
    except Exception as e:
        print(f"✗ 生成失败: {e}")
        return False

def main():
    print("=" * 60)
    print("生成测试音频")
    print("=" * 60)
    
    print("\n选项1: 使用ffmpeg生成简单音频（推荐）")
    print("选项2: 手动提供音频文件")
    print("\n建议: 使用真实的中文语音音频文件进行测试效果更好")
    print("可以从Bilibili下载一段短视频的音频，或录制一段语音\n")
    
    choice = input("选择 [1/2] (默认1): ").strip() or "1"
    
    if choice == "1":
        if generate_with_ffmpeg():
            print("\n注意: 这是一个纯音调音频，不包含语音")
            print("建议使用真实的中文语音文件替换 test_audio.mp3")
        else:
            print("\n请手动提供音频文件")
    else:
        print("\n请将音频文件命名为 test_audio.mp3 并放到此目录")
    
    print("\n完成后运行: python test_stt_service.py")

if __name__ == '__main__':
    main()
