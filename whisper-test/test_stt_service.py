#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Whisper STT服务测试脚本
用于验证本地STT服务是否正常工作
"""

import requests
import os
import time
import json
from pathlib import Path

# 配置
STT_SERVICE_URL = "http://127.0.0.1:9977"
TEST_AUDIO_FILE = "test_audio.mp3"
OUTPUT_DIR = "output"

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")

def print_section(title):
    print(f"\n{'='*60}")
    print(f"{Colors.BLUE}{title}{Colors.END}")
    print('='*60)

def test_service_health():
    """测试1: 检查服务健康状态"""
    print_section("测试1: 服务健康检查")
    
    try:
        response = requests.get(f"{STT_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"服务运行正常: {data}")
            return True
        else:
            print_error(f"服务返回异常状态码: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("无法连接到STT服务")
        print_info("请确保STT服务正在运行: python stt_api_service.py")
        return False
    except Exception as e:
        print_error(f"健康检查失败: {e}")
        return False

def create_test_audio():
    """创建测试音频文件（如果不存在）"""
    print_section("准备测试音频")
    
    if os.path.exists(TEST_AUDIO_FILE):
        file_size = os.path.getsize(TEST_AUDIO_FILE) / 1024  # KB
        print_success(f"找到测试音频: {TEST_AUDIO_FILE} ({file_size:.2f} KB)")
        return True
    else:
        print_warning(f"未找到测试音频文件: {TEST_AUDIO_FILE}")
        print_info("请提供一个测试音频文件，或使用以下命令生成:")
        print_info("  ffmpeg -f lavfi -i \"sine=frequency=1000:duration=5\" test_audio.mp3")
        
        # 尝试生成简单的测试音频
        try:
            import subprocess
            print_info("尝试使用ffmpeg生成5秒测试音频...")
            subprocess.run([
                'ffmpeg', '-f', 'lavfi', '-i', 
                'sine=frequency=1000:duration=5', 
                '-y', TEST_AUDIO_FILE
            ], check=True, capture_output=True)
            print_success("测试音频生成成功")
            return True
        except Exception as e:
            print_error(f"无法生成测试音频: {e}")
            print_info("请手动提供一个音频文件")
            return False

def test_transcription():
    """测试2: 音频转写"""
    print_section("测试2: 音频转写")
    
    if not os.path.exists(TEST_AUDIO_FILE):
        print_error("测试音频文件不存在")
        return False
    
    try:
        # 准备请求
        print_info("上传音频文件到STT服务...")
        
        with open(TEST_AUDIO_FILE, 'rb') as audio_file:
            files = {'file': (TEST_AUDIO_FILE, audio_file, 'audio/mpeg')}
            data = {
                'language': 'zh',
                'model': 'base',
                'response_format': 'srt'
            }
            
            # 记录开始时间
            start_time = time.time()
            
            # 发送请求
            response = requests.post(
                f"{STT_SERVICE_URL}/api",
                files=files,
                data=data,
                timeout=300  # 5分钟超时
            )
            
            # 记录结束时间
            elapsed_time = time.time() - start_time
        
        # 检查响应
        if response.status_code == 200:
            result = response.json()
            
            if result.get('code') == 0:
                subtitle = result.get('data', '')
                print_success(f"转写成功! 耗时: {elapsed_time:.2f}秒")
                print_info(f"字幕长度: {len(subtitle)} 字符")
                
                # 保存结果
                os.makedirs(OUTPUT_DIR, exist_ok=True)
                output_file = os.path.join(OUTPUT_DIR, 'subtitle.srt')
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(subtitle)
                print_success(f"字幕已保存到: {output_file}")
                
                # 显示前几行
                lines = subtitle.split('\n')[:10]
                print_info("字幕预览 (前10行):")
                for line in lines:
                    print(f"  {line}")
                
                return True, subtitle, elapsed_time
            else:
                print_error(f"转写失败: {result.get('msg')}")
                return False, None, elapsed_time
        else:
            print_error(f"请求失败: HTTP {response.status_code}")
            print_error(f"响应内容: {response.text}")
            return False, None, 0
            
    except requests.exceptions.Timeout:
        print_error("请求超时（超过5分钟）")
        return False, None, 0
    except Exception as e:
        print_error(f"转写测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False, None, 0

def validate_srt_format(subtitle):
    """测试3: 验证SRT格式"""
    print_section("测试3: SRT格式验证")
    
    if not subtitle:
        print_error("没有字幕内容可验证")
        return False
    
    try:
        lines = subtitle.strip().split('\n')
        
        # 检查基本结构
        if len(lines) < 3:
            print_error("字幕内容太短，不符合SRT格式")
            return False
        
        # 检查序号
        if not lines[0].strip().isdigit():
            print_error("第一行应该是序号")
            return False
        
        # 检查时间戳
        if '-->' not in lines[1]:
            print_error("第二行应该包含时间戳")
            return False
        
        # 统计字幕块数量
        subtitle_count = subtitle.count('\n\n') + 1
        
        print_success("SRT格式验证通过")
        print_info(f"字幕块数量: {subtitle_count}")
        print_info(f"总行数: {len(lines)}")
        
        return True
        
    except Exception as e:
        print_error(f"格式验证失败: {e}")
        return False

def generate_report(results):
    """生成测试报告"""
    print_section("测试报告")
    
    report_lines = [
        "=" * 60,
        "Whisper STT服务测试报告",
        "=" * 60,
        f"测试时间: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"服务地址: {STT_SERVICE_URL}",
        "",
        "测试结果:",
        "-" * 60,
    ]
    
    total_tests = len(results)
    passed_tests = sum(1 for r in results.values() if r)
    
    for test_name, passed in results.items():
        status = "✓ 通过" if passed else "✗ 失败"
        report_lines.append(f"{test_name}: {status}")
    
    report_lines.extend([
        "-" * 60,
        f"总计: {passed_tests}/{total_tests} 测试通过",
        "=" * 60,
    ])
    
    report = "\n".join(report_lines)
    
    # 保存报告
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    report_file = os.path.join(OUTPUT_DIR, 'test_report.txt')
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(report)
    print_info(f"报告已保存到: {report_file}")
    
    return passed_tests == total_tests

def main():
    """主测试流程"""
    print_section("Whisper STT服务测试")
    print_info(f"服务地址: {STT_SERVICE_URL}")
    print_info(f"测试音频: {TEST_AUDIO_FILE}")
    print_info(f"输出目录: {OUTPUT_DIR}")
    
    results = {}
    
    # 测试1: 健康检查
    results['健康检查'] = test_service_health()
    if not results['健康检查']:
        print_error("\n服务未运行，无法继续测试")
        return False
    
    # 准备测试音频
    if not create_test_audio():
        print_error("\n无法准备测试音频，无法继续测试")
        return False
    
    # 测试2: 音频转写
    success, subtitle, elapsed_time = test_transcription()
    results['音频转写'] = success
    
    if success:
        # 测试3: 格式验证
        results['格式验证'] = validate_srt_format(subtitle)
        
        # 性能评估
        print_section("性能评估")
        audio_size = os.path.getsize(TEST_AUDIO_FILE) / 1024 / 1024  # MB
        print_info(f"音频大小: {audio_size:.2f} MB")
        print_info(f"处理时间: {elapsed_time:.2f} 秒")
        if elapsed_time > 0:
            print_info(f"处理速度: {audio_size/elapsed_time:.2f} MB/秒")
    
    # 生成报告
    all_passed = generate_report(results)
    
    if all_passed:
        print_success("\n所有测试通过! 🎉")
        return True
    else:
        print_error("\n部分测试失败，请检查上述错误信息")
        return False

if __name__ == '__main__':
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print_warning("\n\n测试被用户中断")
        exit(1)
    except Exception as e:
        print_error(f"\n测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
