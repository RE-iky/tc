#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的STT API服务
使用faster-whisper提供语音识别API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from faster_whisper import WhisperModel
import os
import tempfile
import time

app = Flask(__name__)
CORS(app)

# 全局模型缓存
models = {}

def get_model(model_size="base"):
    """获取或加载模型"""
    if model_size not in models:
        print(f"加载模型: {model_size}")
        # 尝试使用GPU，如果失败则回退到CPU
        try:
            models[model_size] = WhisperModel(
                model_size,
                device="cuda",
                compute_type="float16"
            )
            print(f"使用GPU加速模式")
        except Exception as e:
            print(f"GPU加载失败，使用CPU模式: {e}")
            models[model_size] = WhisperModel(
                model_size,
                device="cpu",
                compute_type="int8"
            )
    return models[model_size]

def format_timestamp(seconds):
    """将秒数转换为SRT时间格式"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

@app.route('/api', methods=['POST'])
def transcribe():
    """语音识别API端点"""
    try:
        # 检查文件
        if 'file' not in request.files:
            return jsonify({
                'code': 1,
                'msg': '未找到音频文件'
            }), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'code': 1,
                'msg': '文件名为空'
            }), 400

        # 获取参数
        language = request.form.get('language', 'zh')
        model_size = request.form.get('model', 'base')
        response_format = request.form.get('response_format', 'srt')

        print(f"收到请求: language={language}, model={model_size}, format={response_format}")

        # 保存临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
            file.save(tmp_file.name)
            tmp_path = tmp_file.name

        try:
            # 加载模型
            model = get_model(model_size)

            # 进行识别
            print(f"开始识别: {tmp_path}")
            start_time = time.time()

            segments, info = model.transcribe(
                tmp_path,
                language=language,
                beam_size=5,
                vad_filter=False
            )

            # 生成SRT格式字幕
            srt_content = []
            segment_list = list(segments)

            for i, segment in enumerate(segment_list, 1):
                start = format_timestamp(segment.start)
                end = format_timestamp(segment.end)
                text = segment.text.strip()

                srt_content.append(f"{i}")
                srt_content.append(f"{start} --> {end}")
                srt_content.append(text)
                srt_content.append("")

            result = "\n".join(srt_content)
            elapsed = time.time() - start_time

            print(f"识别到 {len(segment_list)} 个语音片段")
            print(f"识别完成，耗时: {elapsed:.2f}秒")
            print(f"字幕长度: {len(result)} 字符")

            return jsonify({
                'code': 0,
                'msg': 'success',
                'data': result
            })

        finally:
            # 删除临时文件
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'code': 1,
            'msg': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """健康检查端点"""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("=" * 50)
    print("STT API服务启动中...")
    print("=" * 50)

    # 预加载base模型
    print("预加载base模型...")
    get_model("base")
    print("模型加载完成！")

    print("\n服务运行在: http://127.0.0.1:9977")
    print("API端点: http://127.0.0.1:9977/api")
    print("=" * 50)

    app.run(host='127.0.0.1', port=9977, debug=False)
