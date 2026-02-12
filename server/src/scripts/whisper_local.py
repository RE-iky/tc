#!/usr/bin/env python3
"""
本地Whisper转写脚本
使用faster-whisper进行GPU加速的音频转写
"""

import sys
import json
from pathlib import Path

def transcribe_audio(audio_path: str, language: str = "zh", model_size: str = "medium") -> dict:
    """
    使用faster-whisper转写音频

    Args:
        audio_path: 音频文件路径
        language: 语言代码 (zh, en等)
        model_size: 模型大小 (tiny, base, small, medium, large)

    Returns:
        包含字幕内容的字典
    """
    try:
        from faster_whisper import WhisperModel

        # 初始化模型（使用GPU）
        print(f"Loading Whisper model: {model_size}", file=sys.stderr)
        model = WhisperModel(
            model_size,
            device="cuda",  # 使用GPU
            compute_type="float16"  # 使用float16加速
        )

        # 转写音频
        print(f"Transcribing audio: {audio_path}", file=sys.stderr)
        segments, info = model.transcribe(
            audio_path,
            language=language,
            beam_size=5,
            vad_filter=True  # 使用VAD过滤静音
        )

        # 转换为SRT格式
        srt_content = []
        segment_index = 1

        for segment in segments:
            start_time = format_timestamp(segment.start)
            end_time = format_timestamp(segment.end)
            text = segment.text.strip()

            srt_content.append(f"{segment_index}")
            srt_content.append(f"{start_time} --> {end_time}")
            srt_content.append(text)
            srt_content.append("")  # 空行

            segment_index += 1

        result = {
            "success": True,
            "subtitle": "\n".join(srt_content),
            "format": "srt",
            "language": info.language,
            "duration": info.duration
        }

        return result

    except ImportError:
        return {
            "success": False,
            "error": "faster-whisper未安装，请运行: pip install faster-whisper"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def format_timestamp(seconds: float) -> str:
    """
    将秒数转换为SRT时间戳格式 (HH:MM:SS,mmm)
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)

    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python whisper_local.py <audio_path> [language] [model_size]"
        }))
        sys.exit(1)

    audio_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "zh"
    model_size = sys.argv[3] if len(sys.argv) > 3 else "medium"

    # 检查文件是否存在
    if not Path(audio_path).exists():
        print(json.dumps({
            "success": False,
            "error": f"Audio file not found: {audio_path}"
        }))
        sys.exit(1)

    # 执行转写
    result = transcribe_audio(audio_path, language, model_size)

    # 输出JSON结果
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
