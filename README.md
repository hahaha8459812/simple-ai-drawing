# Simple AI Drawing - 图生图功能完整版

支持文生图和图生图的海豹骰AI绘图插件（v3.0.0）

## 📋 功能特性

- ✅ **文生图**：直接通过文字描述生成图片
- ✅ **图生图**：基于输入图片和文字描述生成新图片
- ✅ **Gemini 2.0 Flash**：使用最新的 Gemini 多模态模型
- ✅ **独立后端**：解决海豹JS环境限制

## 🏗️ 架构说明

由于海豹骰的 JavaScript 环境限制（不支持 `arrayBuffer()` 和 `XMLHttpRequest`），图生图功能采用了**前后端分离**的架构：

```
用户消息 → 海豹JS插件 → 后端服务 → Gemini API → 后端服务 → 海豹JS插件 → 用户
         (提取图片URL)   (下载+转换)   (图生图)    (返回base64)  (显示图片)
```

## 📦 安装与使用

### 步骤 1: 下载插件包

从仓库下载整个 `simple-ai-drawing` 文件夹。

### 步骤 2: 放置插件

将下载的 `simple-ai-drawing` 文件夹完整地放入海豹的脚本目录：
```
<海豹数据目录>/data/default/scripts/
```
海豹会自动加载 `simple-ai-drawing` 文件夹内的 `simple-ai-drawing.js` 插件。

### 步骤 3: 配置插件

在海豹Web界面 → **扩展管理** → **Simple AI Drawing**，配置以下项：

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `apiEndpoint` | Gemini API 根地址 | `https://generativelanguage.googleapis.com` |
| `apiKey` | Gemini API Key | `AIza...` |
| `model` | Gemini 模型名称 | `gemini-2.0-flash-exp` |
| `backendUrl` | 后端服务地址（图生图） | `http://localhost:5000/process-image` |

**注意：**
- 如果只需要文生图功能，可以不配置 `backendUrl`。
- `backendUrl` 留空会禁用图生图功能。

### 步骤 4: 启动后端服务 (仅图生图需要)

**Windows用户 - 超简单！**
1. 确保已安装Python (安装时勾选 "Add Python to PATH")。
2. 进入 `simple-ai-drawing` 文件夹，双击 `启动图生图服务(Windows).bat` 即可！
   - 脚本会自动检查和安装依赖，并启动后端服务。

**其他系统用户 (手动启动):**
```bash
# 进入backend目录
cd <海豹脚本目录>/simple-ai-drawing/backend

# 安装依赖
pip install flask flask-cors requests pillow

# 启动服务
python backend_service.py
```
服务将运行在 `http://localhost:5000`。

#### 方式B：Docker 部署

创建 `Dockerfile`：
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY backend_service.py .
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD ["python", "backend_service.py"]
```

创建 `requirements.txt`：
```
flask==2.3.0
flask-cors==4.0.0
requests==2.31.0
pillow==10.0.0
```

构建并运行：
```bash
docker build -t ai-drawing-backend .
docker run -d -p 5000:5000 ai-drawing-backend
```

### 3. 配置插件

在海豹骰的Web界面中，找到 **扩展管理 → Simple AI Drawing**，配置以下项：

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `apiEndpoint` | Gemini API 根地址 | `https://generativelanguage.googleapis.com` |
| `apiKey` | Gemini API Key | `AIza...` |
| `model` | Gemini 模型名称 | `gemini-2.0-flash-exp` |
| `backendUrl` | 后端服务地址（图生图） | `http://localhost:5000/process-image` |

**注意：**
- 如果只需要文生图功能，可以不配置 `backendUrl`
- `backendUrl` 留空会禁用图生图功能

## 🎯 使用方法

### 文生图

```
.ai 画一只可爱的猫咪
.ai 赛博朋克风格的城市夜景
.ai 宫崎骏风格的森林场景
```

### 图生图

在**同一条消息**中发送图片和指令：

```
[粘贴图片] .ai 将这张图改成油画风格
[粘贴图片] .ai 把背景改成雪地
[粘贴图片] .ai 将这张图片转换为水彩画风格
```

**注意事项：**
- 图片必须在同一条消息中直接发送
- 不支持引用之前的消息中的图片
- 图生图功能需要配置后端服务

## 🔧 故障排除

### 文生图不工作

1. 检查 Gemini API Key 是否正确配置
2. 检查 API 地址是否可访问
3. 查看海豹日志获取详细错误信息

### 图生图不工作

1. **检查后端服务是否运行：**
   ```bash
   curl http://localhost:5000/health
   ```
   应返回：`{"status":"ok","service":"Simple AI Drawing Backend"}`

2. **检查后端服务地址配置：**
   - 确保配置的是完整URL：`http://localhost:5000/process-image`
   - 如果海豹和后端不在同一台机器，使用实际IP地址

3. **查看日志：**
   - 海豹日志：查看插件的错误信息
   - 后端日志：查看 Python 服务的控制台输出

### 常见错误

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `无法连接到后端服务` | 后端服务未启动 | 启动 `backend_service.py` |
| `后端服务错误: 400` | 请求参数错误 | 检查插件和后端版本是否匹配 |
| `后端服务错误: 500` | 后端处理失败 | 查看后端日志获取详细错误 |
| `调用Gemini API失败` | API Key 错误或额度不足 | 检查 API Key 和账户额度 |

## 📖 API 文档

### 后端服务 API

**接口：** `POST /process-image`

**请求体：**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "将这张图改成油画风格",
  "geminiApiKey": "AIza...",
  "geminiModel": "gemini-2.0-flash-exp"
}
```

**响应：**
```json
{
  "success": true,
  "image_base64": "iVBORw0KGgo..."
}
```

**健康检查：** `GET /health`

## 🔐 安全建议

1. **不要在公网暴露后端服务**：后端服务包含 API Key，应该只在内网使用
2. **使用环境变量**：可以修改后端代码，从环境变量读取 API Key
3. **添加认证**：如需公网部署，建议添加 API 认证机制

## 📝 更新日志

### v3.0.0 (2025-01-16)
- ✨ 新增图生图功能（需要后端服务支持）
- 🏗️ 采用前后端分离架构
- 📝 完善文档和配置说明
- 🐛 修复海豹JS环境限制导致的问题

### v2.4.0
- 🔧 尝试实现图生图功能（受限于环境）

### v2.3.1
- ✅ 支持基础文生图功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👥 作者

- 原作者：罗德岛家岁片
- 图生图功能与重构：Kilo Code

## ✨ 特别致谢

本插件的开发和调试过程得到了以下AI模型的鼎力支持：

- **gpt-5**
- **gemin-2.5-pro**
- **claude-sonnet-4-5-20250929-thinking**

感谢它们在代码生成、问题诊断和文档编写方面提供的巨大帮助。

## 📚 文档导航

- **[README.md](README.md)** - 完整使用文档（本文档）
- **[使用说明.txt](使用说明.txt)** - 快速开始指南
- **[docs/WINDOWS_测试指南.md](docs/WINDOWS_测试指南.md)** - Windows详细测试步骤

## 🔗 相关链接

- [海豹骰官网](https://dice.weizaima.com/)
- [Gemini API 文档](https://ai.google.dev/docs)
- [插件仓库](https://github.com/sealdice/javascript)