#!/usr/bin/env node
/**
 * 前后端通信流程测试脚本
 * 测试从创建字幕任务到获取结果的完整流程
 */

import axios from 'axios';

// 配置
const BACKEND_URL = 'http://localhost:3001';
const TEST_VIDEO_URL = 'https://www.bilibili.com/video/BV1xx411c7XZ'; // 示例URL

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function printSuccess(msg) {
  console.log(`${colors.green}✓ ${msg}${colors.reset}`);
}

function printError(msg) {
  console.log(`${colors.red}✗ ${msg}${colors.reset}`);
}

function printInfo(msg) {
  console.log(`${colors.blue}ℹ ${msg}${colors.reset}`);
}

function printWarning(msg) {
  console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`);
}

function printSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log('='.repeat(60));
}

// 测试1: 检查后端服务健康状态
async function testBackendHealth() {
  printSection('测试1: 后端服务健康检查');

  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    if (response.status === 200) {
      printSuccess(`后端服务运行正常: ${JSON.stringify(response.data)}`);
      return true;
    } else {
      printError(`后端服务返回异常状态码: ${response.status}`);
      return false;
    }
  } catch (error) {
    printError(`无法连接到后端服务: ${error.message}`);
    printInfo('请确保后端服务正在运行: cd server && npm run dev');
    return false;
  }
}

// 测试2: 创建字幕生成任务
async function testCreateSubtitleJob(videoUrl) {
  printSection('测试2: 创建字幕生成任务');

  try {
    printInfo(`视频URL: ${videoUrl}`);

    const response = await axios.post(
      `${BACKEND_URL}/api/subtitles/jobs`,
      {
        videoUrl: videoUrl,
        language: 'zh'
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    if (response.data.success) {
      const jobId = response.data.data.jobId;
      printSuccess(`任务创建成功! Job ID: ${jobId}`);
      printInfo(`任务状态: ${response.data.data.status}`);
      return jobId;
    } else {
      printError(`任务创建失败: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    printError(`创建任务失败: ${error.message}`);
    if (error.response) {
      printError(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// 测试3: 轮询任务状态
async function testPollJobStatus(jobId, maxAttempts = 60, interval = 2000) {
  printSection('测试3: 轮询任务状态');

  printInfo(`Job ID: ${jobId}`);
  printInfo(`最大轮询次数: ${maxAttempts}, 间隔: ${interval}ms`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/subtitles/jobs/${jobId}`,
        { timeout: 5000 }
      );

      if (response.data.success) {
        const job = response.data.data;
        const progress = job.progress || 0;

        printInfo(`[${attempt}/${maxAttempts}] 状态: ${job.status}, 进度: ${progress}%`);

        if (job.status === 'done') {
          printSuccess('任务完成!');
          printInfo(`字幕长度: ${job.result.subtitle.length} 字符`);
          printInfo(`字幕格式: ${job.result.format}`);
          printInfo(`生成模式: ${job.result.mode}`);

          // 显示字幕预览
          const lines = job.result.subtitle.split('\n').slice(0, 15);
          printInfo('字幕预览 (前15行):');
          lines.forEach(line => console.log(`  ${line}`));

          return job.result;
        } else if (job.status === 'error') {
          printError(`任务失败: ${job.error}`);
          return null;
        }

        // 继续轮询
        await new Promise(resolve => setTimeout(resolve, interval));
      } else {
        printError(`获取任务状态失败: ${response.data.message}`);
        return null;
      }
    } catch (error) {
      printError(`轮询失败 [${attempt}/${maxAttempts}]: ${error.message}`);

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      } else {
        return null;
      }
    }
  }

  printWarning('轮询超时，任务可能仍在处理中');
  return null;
}

// 测试4: 验证SRT格式
function testValidateSRTFormat(subtitle) {
  printSection('测试4: SRT格式验证');

  if (!subtitle) {
    printError('没有字幕内容可验证');
    return false;
  }

  try {
    const lines = subtitle.trim().split('\n');

    // 检查基本结构
    if (lines.length < 3) {
      printError('字幕内容太短，不符合SRT格式');
      return false;
    }

    // 检查序号
    if (!lines[0].trim().match(/^\d+$/)) {
      printError(`第一行应该是序号，实际内容: "${lines[0]}"`);
      return false;
    }

    // 检查时间戳
    if (!lines[1].includes('-->')) {
      printError(`第二行应该包含时间戳，实际内容: "${lines[1]}"`);
      return false;
    }

    // 统计字幕块数量
    const subtitleCount = (subtitle.match(/\n\n/g) || []).length + 1;

    printSuccess('SRT格式验证通过');
    printInfo(`字幕块数量: ${subtitleCount}`);
    printInfo(`总行数: ${lines.length}`);

    return true;
  } catch (error) {
    printError(`格式验证失败: ${error.message}`);
    return false;
  }
}

// 主测试流程
async function main() {
  printSection('前后端通信流程测试');
  printInfo(`后端地址: ${BACKEND_URL}`);
  printInfo(`测试视频: ${TEST_VIDEO_URL}`);

  const results = {};

  // 测试1: 后端健康检查
  results['后端健康检查'] = await testBackendHealth();
  if (!results['后端健康检查']) {
    printError('\n后端服务未运行，无法继续测试');
    return false;
  }

  // 测试2: 创建字幕任务
  const jobId = await testCreateSubtitleJob(TEST_VIDEO_URL);
  results['创建字幕任务'] = !!jobId;

  if (!jobId) {
    printError('\n无法创建字幕任务，无法继续测试');
    return false;
  }

  // 测试3: 轮询任务状态
  const result = await testPollJobStatus(jobId);
  results['轮询任务状态'] = !!result;

  if (result && result.subtitle) {
    // 测试4: 验证SRT格式
    results['SRT格式验证'] = testValidateSRTFormat(result.subtitle);
  }

  // 生成测试报告
  printSection('测试报告');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;

  console.log('\n测试结果:');
  console.log('-'.repeat(60));
  Object.entries(results).forEach(([name, passed]) => {
    const status = passed ? '✓ 通过' : '✗ 失败';
    console.log(`${name}: ${status}`);
  });
  console.log('-'.repeat(60));
  console.log(`总计: ${passedTests}/${totalTests} 测试通过\n`);

  if (passedTests === totalTests) {
    printSuccess('所有测试通过! 🎉');
    printInfo('\n结论: 后端字幕生成流程正常工作');
    printWarning('问题可能在前端: 生成的字幕没有被正确渲染到视频画面上');
    return true;
  } else {
    printError('部分测试失败，请检查上述错误信息');
    return false;
  }
}

// 运行测试
main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    printError(`测试过程中发生错误: ${error.message}`);
    console.error(error);
    process.exit(1);
  });

export { testBackendHealth, testCreateSubtitleJob, testPollJobStatus, testValidateSRTFormat };
