// ==UserScript==
// @name         Simple AI Drawing
// @author       罗德岛家岁片
// @version      3.0.0
// @description  使用 .ai <提示词> 调用Gemini多模态模型画图，支持图生图功能（需要配置后端服务）。
// @timestamp    1760389052
// @license      MIT
// @homepageURL  https://github.com/sealdice/javascript
// @sealVersion  1.5.1
// ==/UserScript==

// 辅助函数：从消息中提取图片URL
function extractImageUrls(message) {
  const imageUrls = [];
  // 匹配 CQ 码中的图片 URL，支持多种格式
  const cqImageRegex = /\[CQ:image,file=([^\]]+)\]/g;
  let match;
  while ((match = cqImageRegex.exec(message)) !== null) {
    imageUrls.push(match[1]);
  }
  return imageUrls;
}

// 辅助函数：通过后端服务处理图片
async function processImageThroughBackend(backendUrl, imageUrl, textPrompt, geminiApiEndpoint, geminiApiKey, geminiModel) {
  console.log('=== 图生图处理开始 ===');
  console.log('[步骤1] 准备发送请求到后端服务');
  console.log('[配置] 后端地址:', backendUrl);
  console.log('[配置] Gemini地址:', geminiApiEndpoint);
  console.log('[配置] 图片URL:', imageUrl.substring(0, 100) + '...');
  console.log('[配置] 提示词:', textPrompt);
  console.log('[配置] 模型:', geminiModel);
  
  try {
    console.log('[步骤2] 发起fetch请求...');
    const requestStartTime = Date.now();
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: imageUrl,
        prompt: textPrompt,
        geminiApiEndpoint: geminiApiEndpoint,
        geminiApiKey: geminiApiKey,
        geminiModel: geminiModel
      })
    });
    
    const requestDuration = ((Date.now() - requestStartTime) / 1000).toFixed(1);
    console.log(`[步骤3] 后端响应 - 状态码: ${response.status}, 耗时: ${requestDuration}秒`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('[错误] 后端返回错误响应:', errorText);
      
      // 尝试解析JSON错误
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          console.log('[错误详情]', errorJson.error);
          return { success: false, error: `后端错误: ${errorJson.error}` };
        }
      } catch (e) {
        // 不是JSON，使用原始文本
      }
      
      return { success: false, error: `后端服务错误 (${response.status}): ${errorText.substring(0, 200)}` };
    }
    
    console.log('[步骤4] 解析后端响应...');
    const data = await response.json();
    
    if (!data.image_base64) {
      console.log('[错误] 后端响应中缺少image_base64字段');
      console.log('[响应数据]', JSON.stringify(data).substring(0, 200));
      return { success: false, error: '后端响应格式错误：缺少图片数据' };
    }
    
    console.log('[步骤5] 验证base64数据 - 长度:', data.image_base64.length);
    console.log('[成功] 图生图处理完成');
    console.log('=== 图生图处理结束 ===');
    
    return { success: true, base64: data.image_base64 };
  } catch (e) {
    console.log('[严重错误] 请求后端服务时发生异常');
    console.log('[异常类型]', e.name || '未知');
    console.log('[异常消息]', e.message || e.toString());
    console.log('[异常堆栈]', e.stack || '无堆栈信息');
    console.log('=== 图生图处理异常结束 ===');
    
    return {
      success: false,
      error: `无法连接到后端服务: ${e.message || e}\n请检查:\n1. 后端服务是否启动\n2. 地址配置是否正确\n3. 防火墙设置`
    };
  }
}

// 辅助函数：从消息中移除图片CQ码，获取纯文本
function removeImageCQ(message) {
  return message.replace(/\[CQ:image,file=[^\]]+\]/g, '').trim();
}

// 辅助函数：解析预制提示词配置
function parsePresetPrompts(config) {
    const presets = new Map();
    if (config && Array.isArray(config)) {
        for (const line of config) {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const keyword = parts[0].trim();
                const prompt = parts.slice(1).join(':').trim();
                if (keyword && prompt) {
                    presets.set(keyword, prompt);
                }
            }
        }
    }
    return presets;
}

// 首先检查是否已经存在同名扩展, 如果没有再注册
if (!seal.ext.find('simple-ai-drawing')) {
  // 创建扩展
  const ext = seal.ext.new('simple-ai-drawing', '罗德岛家岁片', '3.0.0');

  // 创建主指令
  const cmdDraw = seal.ext.newCmdItemInfo();
  cmdDraw.name = '生图';
  cmdDraw.help = '使用AI模型画图。\n\n【文生图】\n用法: .生图 <画图提示词>\n示例: .生图 画一只可爱的猫咪\n\n【图生图】\n用法: 在同一条消息中发送图片和指令\n示例: [图片] .生图 将这张图改成油画风格\n\n【预制提示词】\n用法: .生图 <关键词>\n示例: .生图 手办化\n\n使用 .生图预设 查看所有可用关键词。\n\n⚠️ 注意：\n- 图生图功能需要配置后端服务\n- 预制提示词可在WebUI中配置';

  // 指令核心函数
  cmdDraw.solve = async (ctx, msg, cmdArgs) => {
    // 获取原始消息内容（包含图片CQ码）
    const fullMessage = msg.message;
    const userInput = cmdArgs.rawArgs.trim();
    
    // 从当前消息中提取图片URL（仅支持直接发送的图片，不支持引用）
    const imageUrls = extractImageUrls(fullMessage);
    
    // 从原始消息中移除图片CQ码，获取纯文本提示词
    let textPrompt = removeImageCQ(fullMessage);
    // 如果有指令参数，使用指令参数作为提示词（也需要清理CQ码）
    if (userInput) {
      textPrompt = removeImageCQ(userInput);
    } else {
      // 移除指令本身（.生图）
      textPrompt = textPrompt.replace(/^\.生图\s*/i, '').trim();
    }

    // 如果既没有图片也没有文本，则显示帮助
    if (!textPrompt && imageUrls.length === 0) {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    
    // 如果只有图片没有文本提示词，提示用户需要提供描述
    if (imageUrls.length > 0 && !textPrompt) {
      seal.replyToSender(ctx, msg, '❌ 图生图需要同时提供文字描述\n\n正确示例：在同一条消息中发送\n[图片] .生图 将这张图改成油画风格');
      return seal.ext.newCmdExecuteResult(true);
    }
    
    // 如果没有图片但在尝试引用，给出提示
    if (!textPrompt && imageUrls.length === 0) {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }

    // 从配置中获取API信息
    const apiEndpoint = seal.ext.getStringConfig(ext, 'apiEndpoint');
    const apiKey = seal.ext.getStringConfig(ext, 'apiKey');
    const model = seal.ext.getStringConfig(ext, 'model');
    const backendUrl = seal.ext.getStringConfig(ext, 'backendUrl');
    const presetPromptsConfig = seal.ext.getTemplateConfig(ext, 'presetPrompts');
    const presets = parsePresetPrompts(presetPromptsConfig);

    // 检查是否使用预制提示词
    let finalPrompt = textPrompt;
    let usedPreset = null;
    if (presets.has(textPrompt)) {
        usedPreset = textPrompt;
        finalPrompt = presets.get(textPrompt);
    }

    // 检查核心配置
    if (!apiEndpoint || !apiKey) {
      seal.replyToSender(ctx, msg, 'AI功能未配置，请联系骰主在插件设置中填写API根地址和API Key。');
      return seal.ext.newCmdExecuteResult(true);
    }
    
    // 如果有图片但没有配置后端服务
    if (imageUrls.length > 0 && !backendUrl) {
      seal.replyToSender(ctx, msg, '❌ 图生图功能需要配置后端服务\n\n请联系骰主在插件配置中设置后端服务地址\n或查看插件文档了解如何部署后端服务');
      return seal.ext.newCmdExecuteResult(true);
    }

    // 显示处理状态
    let statusMessage = '';
    if (usedPreset) {
        statusMessage = `使用预制提示词[${usedPreset}]，`;
    }

    if (imageUrls.length > 0) {
        statusMessage += `检测到${imageUrls.length}张图片，正在处理图生图请求...`;
    } else {
        statusMessage += 'AI画图中，请稍等...';
    }
    seal.replyToSender(ctx, msg, statusMessage);
    const startTime = Date.now(); // 记录开始时间

    try {
      // 构造请求的parts数组
      const parts = [];
      
      // 添加文本提示词（如果有）
      if (finalPrompt) {
        parts.push({ text: finalPrompt });
      }
      
      // 通过后端处理图生图
      if (imageUrls.length > 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[图生图流程] 检测到图片，开始处理');
        console.log('[图片数量]', imageUrls.length);
        console.log('[处理策略] 仅处理第一张图片');
        console.log('━━━━━━━━━━━━━━━━━━━━━━');
        
        // 目前只处理第一张图片
        const imageUrl = imageUrls[0];
        const result = await processImageThroughBackend(backendUrl, imageUrl, finalPrompt, apiEndpoint, apiKey, model);
        
        if (!result.success) {
          console.log('[失败] 图生图处理失败');
          console.log('[失败原因]', result.error);
          seal.replyToSender(ctx, msg, `❌ 图生图处理失败\n\n${result.error}\n\n💡 详细日志请查看海豹控制台`);
          return seal.ext.newCmdExecuteResult(false);
        }
        
        console.log('[成功] 后端返回图片数据');
        console.log('[数据长度]', result.base64.length, '字符');
        
        // 将后端返回的base64转换为图片
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: result.base64
          }
        });
      }
      
      // 如果没有有效的内容，返回错误
      if (parts.length === 0) {
        seal.replyToSender(ctx, msg, '❌ 无法处理请求，请提供文本或有效的图片');
        return seal.ext.newCmdExecuteResult(false);
      }
      
      // 构造原生 Gemini API 请求体
      const requestBody = {
        contents: [{
          parts: parts
        }]
      };

      // 构造带有 API Key 的请求 URL (原生Gemini格式)
      const endpoint = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint;
      const requestUrl = `${endpoint}/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("请求AI服务失败:", errorText);
        seal.replyToSender(ctx, msg, `请求AI服务失败，状态码: ${response.status}`);
        return seal.ext.newCmdExecuteResult(false);
      }

      const data = await response.json();
      
      let imageCqCode = '';

      // 解析 Gemini API 的多模态响应
      if (data.candidates && data.candidates.length > 0) {
        const parts = data.candidates[0].content.parts;
        for (const part of parts) {
          // 我们只关心图片数据，忽略所有文本(part.text)
          if (part.inlineData && part.inlineData.data) {
            const base64Data = part.inlineData.data;
            console.log(`接收到Base64图片数据: ${base64Data.substring(0, 100)}...`);
            const imageUrl = seal.base64ToImage(base64Data);
            if (imageUrl) {
              // 智能处理路径，确保最终格式为 file:///C:/...
              let finalPath = imageUrl;
              if (finalPath.startsWith('file://')) {
                finalPath = finalPath.substring('file://'.length);
              }
              imageCqCode = `[CQ:image,file=file:///${finalPath}]`;
            }
          }
        }
      }

      // 检查是否成功生成了图片CQ码
      if (imageCqCode) {
        const endTime = Date.now(); // 记录结束时间
        const duration = ((endTime - startTime) / 1000).toFixed(1); // 计算耗时，保留一位小数
        // 构造回复消息
        seal.replyToSender(ctx, msg, imageCqCode);
        if (imageUrls.length > 0) {
          seal.replyToSender(ctx, msg, `✅图生图完成，耗时${duration}秒`);
        } else {
          seal.replyToSender(ctx, msg, `✅画图完成，耗时${duration}秒`);
        }
      } else {
        console.log("Gemini响应中未找到图片数据:", JSON.stringify(data));
        seal.replyToSender(ctx, msg, '❌ 未返回图片，请重试');
      }

    } catch (e) {
      console.log('调用AI服务时发生错误:', e);
      seal.replyToSender(ctx, msg, '调用AI服务时发生网络错误，请检查后台日志或API Endpoint配置。');
      return seal.ext.newCmdExecuteResult(false);
    }

    return seal.ext.newCmdExecuteResult(true);
  };

  // 创建预设列表指令
  const cmdPresetList = seal.ext.newCmdItemInfo();
  cmdPresetList.name = '生图预设';
  cmdPresetList.help = '查看所有可用的预制提示词关键词。';
  cmdPresetList.solve = (ctx, msg, cmdArgs) => {
    const presetPromptsConfig = seal.ext.getTemplateConfig(ext, 'presetPrompts');
    const presets = parsePresetPrompts(presetPromptsConfig);
    const keywords = Array.from(presets.keys());

    if (keywords.length > 0) {
      const reply = `当前可用的预制提示词关键词：\n- ${keywords.join('\n- ')}`;
      seal.replyToSender(ctx, msg, reply);
    } else {
      seal.replyToSender(ctx, msg, '当前没有配置任何预制提示词。');
    }
    return seal.ext.newCmdExecuteResult(true);
  };

  // 注册指令
  ext.cmdMap['生图'] = cmdDraw;
  ext.cmdMap['生图预设'] = cmdPresetList;
  // 注册扩展
  seal.ext.register(ext);

  // 在扩展注册后，注册配置项
  seal.ext.registerStringConfig(ext, 'apiEndpoint', 'https://generativelanguage.googleapis.com', 'Gemini API根地址');
  seal.ext.registerStringConfig(ext, 'apiKey', '', 'Gemini API Key');
  seal.ext.registerStringConfig(ext, 'model', 'gemini-2.5-flash-image-preview', 'Gemini模型名称');
  seal.ext.registerStringConfig(ext, 'backendUrl', 'http://localhost:5000/process-image', '图生图后端服务地址（留空则禁用图生图）');
  seal.ext.registerTemplateConfig(ext, 'presetPrompts', [
    '手办化:Your task is to create a photorealistic, masterpiece-quality image of a 1/7 scale commercialized figurine based on the user\'s character. The final image must be in a realistic style and environment.**Crucial Instruction on Face & Likeness:** The figurine\'s face is the most critical element. It must be a perfect, high-fidelity 3D translation of the character from the source image. The sculpt must be sharp, clean, and intricately detailed, accurately capturing the original artwork\'s facial structure, eye style, expression, and hair. The final result must be immediately recognizable as the same character, elevated to a premium physical product standard. Do NOT generate a generic or abstract face.**Scene Composition (Strictly follow these details):**1. **Figurine & Base:** Place the figure on a computer desk. It must stand on a simple, circular, transparent acrylic base WITHOUT any text or markings.2. **Computer Monitor:** In the background, a computer monitor must display 3D modeling software (like ZBrush or Blender) with the digital sculpt of the very same figurine visible on the screen.3. **Artwork Display:** Next to the computer screen, include a transparent acrylic board with a wooden base. This board holds a print of the original 2D artwork that the figurine is based on.4. **Environment:** The overall setting is a desk, with elements like a keyboard to enhance realism. The lighting should be natural and well-lit, as if in a room.'
  ], '预制提示词，格式为 "关键词:提示词"，每行一个');
}