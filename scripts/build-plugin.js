const fs = require('fs');
const path = require('path');

// 读取原始的plugin.json
const pluginJsonPath = path.resolve(__dirname, '../plugin.json');
const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));

// 创建一个新的对象，不包含development属性
const { development, ...productionPluginJson } = pluginJson;

// 将处理后的对象写入到dist目录
const distDir = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(
  path.resolve(distDir, 'plugin.json'),
  JSON.stringify(productionPluginJson, null, 2),
  'utf8'
);

console.log('Production plugin.json created without development property');

// 复制其他必要文件
const filesToCopy = ['logo.png', 'preload.js'];
filesToCopy.forEach(file => {
  fs.copyFileSync(
    path.resolve(__dirname, '..', file),
    path.resolve(distDir, file)
  );
  console.log(`Copied ${file} to dist directory`);
}); 