#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple AI Drawing Backend Service
用于处理图片下载和转换的后端服务

依赖安装：
pip install flask requests pillow

使用方法：
python backend_service.py

默认运行在 http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
from io import BytesIO
from PIL import Image
import logging

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def download_image(url):
    """下载图片并转换为base64"""
    try:
        logger.info(f"开始下载图片: {url[:100]}...")
        
        # 下载图片
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        logger.info(f"图片下载成功，大小: {len(response.content)} bytes")
        
        # 转换为base64
        base64_data = base64.b64encode(response.content).decode('utf-8')
        logger.info(f"Base64转换完成，长度: {len(base64_data)}")
        
        return base64_data, None
    except Exception as e:
        logger.error(f"下载图片失败: {str(e)}")
        return None, str(e)


def call_gemini_api(api_endpoint, api_key, model, prompt, image_base64):
    """调用Gemini API进行图生图"""
    try:
        logger.info("开始调用Gemini API...")
        logger.info(f"API端点: {api_endpoint}")
        logger.info(f"模型: {model}")
        
        # 构造请求 - 使用传入的 API 端点
        # 移除末尾的斜杠（如果有）
        endpoint = api_endpoint.rstrip('/')
        url = f"{endpoint}/v1beta/models/{model}:generateContent?key={api_key}"
        logger.info(f"完整URL: {url}")
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": "image/jpeg",
                            "data": image_base64
                        }
                    }
                ]
            }]
        }
        
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        
        data = response.json()
        logger.info("Gemini API调用成功")
        
        # 提取生成的图片
        if data.get('candidates') and len(data['candidates']) > 0:
            parts = data['candidates'][0]['content']['parts']
            for part in parts:
                if 'inlineData' in part and 'data' in part['inlineData']:
                    return part['inlineData']['data'], None
        
        # 如果没有找到图片，记录完整的API响应
        logger.warning("API响应中未找到图片数据，记录完整响应：")
        logger.warning(data)
        return None, "API响应中未找到生成的图片"
    except Exception as e:
        logger.error(f"调用Gemini API失败: {str(e)}")
        return None, str(e)


@app.route('/process-image', methods=['POST'])
def process_image():
    """处理图生图请求"""
    try:
        data = request.get_json()
        
        # 验证必需参数
        image_url = data.get('imageUrl')
        prompt = data.get('prompt')
        gemini_api_endpoint = data.get('geminiApiEndpoint', 'https://generativelanguage.googleapis.com')
        gemini_api_key = data.get('geminiApiKey')
        gemini_model = data.get('geminiModel', 'gemini-2.0-flash-exp')
        
        if not image_url or not prompt or not gemini_api_key:
            return jsonify({
                'success': False,
                'error': '缺少必需参数: imageUrl, prompt, geminiApiKey'
            }), 400
        
        logger.info(f"Gemini API端点: {gemini_api_endpoint}")
        
        logger.info(f"收到图生图请求，提示词: {prompt}")
        
        # 下载图片
        image_base64, error = download_image(image_url)
        if error:
            return jsonify({
                'success': False,
                'error': f'下载图片失败: {error}'
            }), 500
        
        # 调用Gemini API
        result_base64, error = call_gemini_api(
            gemini_api_endpoint,
            gemini_api_key,
            gemini_model,
            prompt,
            image_base64
        )
        
        if error:
            return jsonify({
                'success': False,
                'error': f'调用Gemini API失败: {error}'
            }), 500
        
        logger.info("图生图处理完成")
        return jsonify({
            'success': True,
            'image_base64': result_base64
        })
        
    except Exception as e:
        logger.error(f"处理请求时发生错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'service': 'Simple AI Drawing Backend'
    })


if __name__ == '__main__':
    port = 35814
    logger.info("启动 Simple AI Drawing Backend Service...")
    logger.info(f"服务地址: http://localhost:{port}")
    logger.info(f"健康检查: http://localhost:{port}/health")
    logger.info(f"API接口: http://localhost:{port}/process-image")
    
    app.run(host='0.0.0.0', port=port, debug=False)