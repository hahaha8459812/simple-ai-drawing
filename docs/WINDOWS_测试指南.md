
# Windows 环境测试指南

## 📋 环境准备

### 1. 安装 Python

**下载：** https://www.python.org/downloads/

**安装时注意：**
- ✅ 勾选 "Add Python to PATH"（非常重要！）
- 建议安装 Python 3.9 或更高版本

**验证安装：**
打开 **命令提示符** (CMD) 或 **PowerShell**：
```cmd
python --version
```
应显示：`Python 3.x.x`

如果提示找不到命令，说明没有正确添加到PATH，需要重新安装Python。

### 2. 安装依赖库

打开 **命令提示符** (CMD) 或 **PowerShell**，执行：

```cmd
pip install flask flask-cors requests pillow
```

**可能遇到的问题：**
- 如果提示 `pip 不是内部或外部命令`，使用 `python -m pip install flask flask-cors requests pillow`
- 如果下载慢，可以使用国内镜像：
  ```cmd
  pip install -i https://pypi.tuna.tsinghua.edu.cn/simple flask flask-cors requests pillow
  ```

## 🚀 快速测试

### 步骤 1：准备文件

1. 创建一个测试文件夹，例如 `C:\ai-drawing-test\`
2. 将以下文件放入该文件夹：
   - `backend_service.py`（后端服务）
   - `simple-ai-drawing.js`（海豹插件）

### 步骤 2：启动后端服务

1. 打开 **命令提示符** 或 **PowerShell**
2. 进入测试文件夹：
   ```cmd
   cd C:\ai-drawing-test
   ```
3. 启动后端服务：
   ```cmd
   python backend_service.py
   ```

**成功的标志：**
```
启动 Simple AI Drawing Backend Service...
服务地址: http://localhost:5000
健康检查: http://localhost:5000/health
API接口: http://localhost:5000/process-image
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
```

**⚠️ 保持此窗口打开！关闭窗口会停止服务。**

### 步骤 3：测试后端服务

打开**新的**命令提示符窗口，测试健康检查：

```cmd
curl http://localhost:5000/health
```

或者在浏览器中访问：
```
http://localhost:5000/health
```

应该看到：
```json
{"status":"ok","service":"Simple AI Drawing Backend"}
```

### 步骤 4：安装海豹插件

1. 将 `simple-ai-drawing.js` 复制到海豹的脚本目录：
   ```
   <海豹数据目录>\data\default\scripts\
   ```
   例如：`E:\测试环境\sealdice-core_1.5.1_windows_amd64\data\default\scripts\`

2. 重启海豹或重新加载脚本

### 步骤 5：配置插件

在海豹Web界面 → **扩展管理** → **Simple AI Drawing**：

| 配置项 | 值 |
|--------|-----|
| apiEndpoint | `https://generativelanguage.googleapis.com` |
| apiKey | 你的 Gemini API Key |
| model | `gemini-2.0-flash-exp` |
| backendUrl | `http://localhost:5000/process-image` |

### 步骤 6：测试功能

#### 测试文生图（不需要后端）

在QQ中发送：
```
.ai 画一只可爱的猫咪
```

#### 测试图生图（需要后端）

1. 在QQ中粘贴一张图片
2. 在**同一条消息**中输入：
   ```
   .ai 将这张图改成油画风格
   ```

## 🐛 常见问题

### 问题1：Python 命令找不到

**症状：**
```
'python' 不是内部或外部命令
```

**解决：**
1. 重新安装 Python，确保勾选 "Add Python to PATH"
2. 或者使用完整路径：`C:\Python39\python.exe backend_service.py`

### 问题2：端口被占用

**症状：**
```
OSError: [WinError 10048] 通常每个套接字地址只允许使用一次
```

**解决：**
1. 查找占用5000端口的程序：
   ```cmd
   netstat -ano | findstr :5000
   ```
2. 结束该进程或修改 `backend_service.py` 中的端口号（最后一行）：
   ```python
   app.run(host='0.0.0.0', port=5001, debug=False)  # 改为5001
   ```
   同时修改插件配置中的 `backendUrl` 为 `http://localhost:5001/process-image`

### 问题3：防火墙拦截

**症状：**
插件无法连接到后端服务

**解决：**
1. Windows 防火墙可能阻止了 Python
2. 首次运行时，Windows 会弹出防火墙警告，请点击"允许访问"
3. 或者在 Windows 防火墙中手动添加 Python 的例外规则

### 问题4：curl 命令不存在

**症状：**
```
'curl' 不是内部或外部命令
```

**解决：**
Windows 10 1803+ 自带 curl，如果没有：
- 直接用浏览器访问 `http://localhost:5000/health`
- 或使用 PowerShell 的 `Invoke-WebRequest`：
  ```powershell
  Invoke-WebRequest http://localhost:5000/health
  ```

## 💡 Windows 特殊提示

### 1. 使用 PowerShell 而非 CMD

PowerShell 功能更强大，建议使用：
```powershell
# 进入目录
cd C:\ai-drawing-test

# 启动服务
python backend_service.py

# 查看日志（实时）
Get-Content -Path "后端.log" -Wait
```

### 2. 创建快捷启动脚本

创建 `启动后端.bat` 文件：
```batch
@echo off
cd /d %~dp0
echo 正在启动 AI Drawing Backend Service...
python backend_service.py
pause
```

双击即可启动后端服务。

### 3. 后台运行（可选）

如果想让后端在后台运行：
```cmd
start /B python backend_service.py
```

或使用 `pythonw.exe`（无窗口）：
```cmd
pythonw backend_service.py
```

## 📊 测试检查清单

- [ ] Python 已安装且在 PATH 中
- [ ] 依赖库安装完成
- [ ] 后端服务成功启动
- [ ] 健康检查返回正常
- [ ] 海豹插件已安装
- [ ] 插件配置已完成
- [ ] 文生图功能正常
- [ ] 图生图功能正常

## 🎯 完整测试流程示例

```cmd
REM 1. 检查 Python
python --version

REM 2. 安装依赖
pip install flask flask-cors requests pillow

REM 3. 启动后端
cd C:\ai-drawing-test
python backend_service.py

REM 4. 在新窗口测试
curl http://localhost:5000/health

REM 5. 在 QQ 中测试
REM .ai 画一只猫
REM [图片] .ai 改成油画风格
```

## 🆘 还有问题？

1. 查看海豹日志：海豹Web界面 → 日志
2. 查看后端日志：Python 服务的控制台输出
3. 确保防火墙允许本地连接
4. 确保图片和指令在同一条消息中

祝测试顺利！🎉