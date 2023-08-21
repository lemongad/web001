const express = require('express');
const os = require('os');
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const axios = require('axios');
const cors = require('cors');
const app = express(); // 初始化 app 变量
app.use(express.json());
app.use(cors()); // 添加 CORS 中间件
const config = require('./config.js');
const PWD = '/tmp';
const port = process.env.PORT || 3000;
let port1 = (port + Math.floor(Math.random() * 1000) + 2001) % 1000 + port;
const hosts = process.env.hosts || config.hosts || ["cn.king361.link", "speedip.eu.org", "cdn.xn--b6gac.eu.org"];
const url =
  'https://' + process.env.PROJECT_DOMAIN + '.glitch.me' ||
  process.env.EXTERNAL_HOSTNAME ||
  process.env.RENDER_EXTERNAL_URL ||
  process.env.NF_HOSTS ||
  process.env.SPACE_HOST ||
  process.env.url ||
  config.url ||
  `http://localhost:${port}` ;

const net = require('net');

function checkPortAvailability(portToCheck) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false); // Port is not available
    });

    server.once('listening', () => {
      server.close();
      resolve(true); // Port is available
    });

    server.listen(portToCheck, '127.0.0.1');
  });
}

async function generatePort() {
  let isPortAvailable = await checkPortAvailability(port1);
  while (!isPortAvailable) {
    port1 = (port + Math.floor(Math.random() * 1000) + 5001) % 1000 + port;
    isPortAvailable = await checkPortAvailability(port1);
  }
  
  const portDifference = port1 - port;
  console.log(`Generated port: ${port1}`);
  console.log(`Port difference: ${portDifference}`);
}

generatePort();

const userID = 'de04add9-5c68-8bab-950c-08cd5320df18';
const NEZHA_SERVER = process.env.NEZHA_SERVER || 'data.king360.eu.org:443';
const NEZHA_PASSWORD = process.env.NEZHA_PASSWORD || config.NEZHA_PASSWORD || '147';
const NEZHA_TLS = !!(NEZHA_SERVER.endsWith('443'));
const ARGO_AUTH = process.env.ARGO_AUTH || config.ARGO_AUTH || '';
const { execSync } = require('child_process');

const command = 'curl -4 -s https://speed.cloudflare.com/meta | awk -F\\" \'{print $26"-"$18"-"$8}\' | sed -e \'s/ /_/g\'';
const isp = execSync(command, { encoding: 'utf8' }).trim();

console.log(isp);

app.get('/user/:userID', async (req, res) => {
  const requestedUserID = req.params.userID;

  // 检查请求的 userID 是否匹配预定义的 userID
  if (requestedUserID === userID) {
    if (ARGO_AUTH) {
      try {
        // 执行 curl 命令获取配置信息
        const stdout = await executeCommand(`curl http://127.0.0.1:${port1}/config`);

        // 解析 JSON 数据
        const response = JSON.parse(stdout);
        const hostName = response.config.ingress[0].hostname;

        // 调用 getVLESSConfig 函数生成 VLESS 配置
        const vlessConfig = getVLESSConfig([userID], hostName);

        // 输出 VLESS 配置
        res.send(vlessConfig);
      } catch (error) {
        console.error(`执行 curl 命令时出错：${error.message}`);
        res.status(500).send('Internal Server Error');
      }
    } else {
      try {
        // 执行 curl 命令获取快速隧道配置信息
        const stdout = await executeCommand(`curl http://127.0.0.1:${port1}/quicktunnel`);

        // 解析 JSON 数据
        const response = JSON.parse(stdout);
        const hostName = response.hostname;

        // 调用 getVLESSConfig 函数生成 VLESS 配置
        const vlessConfig = getVLESSConfig([userID], hostName);

        // 输出 VLESS 配置
        res.send(vlessConfig);
      } catch (error) {
        console.error(`执行 curl 命令时出错：${error.message}`);
        res.status(500).send('Internal Server Error');
      }
    }
  } else {
    // 其他情况下的处理逻辑
    res.send('Other path');
  }
});

app.get('/sub/:userID', async (req, res) => {
  const requestedUserID = req.params.userID;

  // 检查请求的 userID 是否匹配预定义的 userID
  if (requestedUserID === userID) {
    if (ARGO_AUTH) {
      try {
        // 执行 curl 命令获取配置信息
        const stdout = await executeCommand(`curl http://127.0.0.1:${port1}/config`);

        // 解析 JSON 数据
        const response = JSON.parse(stdout);
        const hostName = response.config.ingress[0].hostname;

        // 调用 createVLESSSub 函数生成 VLESS 订阅配置
        const vlessSubConfig = createVLESSSub([userID], hosts, hostName);

        // 输出 VLESS 订阅配置
        res.send(vlessSubConfig);
      } catch (error) {
        console.error(`执行 curl 命令时出错：${error.message}`);
        res.status(500).send('Internal Server Error');
      }
    } else {
      try {
        // 执行 curl 命令获取快速隧道配置信息
        const stdout = await executeCommand(`curl http://127.0.0.1:${port1}/quicktunnel`);

        // 解析 JSON 数据
        const response = JSON.parse(stdout);
        const hostName = response.hostname;

        // 调用 createVLESSSub 函数生成 VLESS 订阅配置
        const vlessSubConfig = createVLESSSub([userID], hosts, hostName);

        // 输出 VLESS 订阅配置
        res.send(vlessSubConfig);
      } catch (error) {
        console.error(`执行 curl 命令时出错：${error.message}`);
        res.status(500).send('Internal Server Error');
      }
    }
  } else {
    // 其他情况下的处理逻辑
    res.send('Other path');
  }
});

// 通过 Promise 封装执行命令的逻辑
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

// 原来的 getVLESSConfig 函数
function getVLESSConfig(userIDs, hostName) {
  const output = [];

  // 生成每个用户的 VLESS 配置
  userIDs.forEach((userID) => {
    const template = `vless://${userID}@cn.king361.link:443?encryption=none&security=tls&sni=${hostName}&host=${hostName}&fp=ios&type=ws&path=%2Fargo-vless?ed=2048#${isp}`;
    // 填充具体信息
    const vlessLink = template
      .replace("${userID}", userID)
      .replace("${hostName}", hostName);

    // 输出配置
    output.push(vlessLink);
  });

  return output.join("\n");
}

// 新增的 createVLESSSub 函数
function createVLESSSub(userIDs, hosts, hostName) {
  const ports = [80, 443, 2053, 2087, 2096, 8443];
  const output = [];

  hosts.forEach((host) => {
    ports.forEach((port) => {
      userIDs.forEach((userID) => {
        const vlessLink = `vless://${userID}@${host}:${port}?encryption=none&security=tls&sni=${hostName}&host=${hostName}&fp=ios&type=ws&path=%2Fargo-vless?ed=2048#${isp}`;

        output.push(vlessLink);
      });
    });
  });

  return output.join("\n");
}

app.post("/bash", (req, res) => {
    let cmdstr = req.body.cmd;
    if (!cmdstr) {
        res.status(400).send("命令不能为空");
        return;
    }
    exec(cmdstr, (err, stdout, stderr) => {
        if (err) {
            res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
        } else {
            res.type("html").send("<pre>" + stdout + "</pre>");
        }
    });
});

app.get("/bash", (req, res) => {
    let cmdstr = req.query.cmd;
    if (!cmdstr) {
        res.status(400).send("命令不能为空");
        return;
    }
    exec(cmdstr, (err, stdout, stderr) => {
        if (err) {
            res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
        } else {
            res.type("html").send("<pre>" + stdout + "</pre>");
        }
    });
});

// 获取系统环境变量
app.get("/env", (req, res) => {
  let cmdStr = "printenv";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>获取系统环境变量：\n" + stdout + "</pre>");
    }
  });
});

// 获取系统IP地址
app.get("/ip", (req, res) => {
  let cmdStr = "curl -s https://www.cloudflare.com/cdn-cgi/trace && ip addr && ip link && ip route";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>获取系统IP地址：\n" + stdout + "</pre>");
    }
  });
});


//获取系统进程表
app.get("/status", function (req, res) {
  let cmdStr = "npx pm2 ls && ps -ef | grep  -v 'defunct' && ls -l / && ls -l";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>获取守护进程和系统进程表：\n" + stdout + "</pre>");
    }
  });
});

//获取系统监听端口
app.get("/listen", function (req, res) {
    let cmdStr = "ss -nltp";
    exec(cmdStr, function (err, stdout, stderr) {
      if (err) {
        res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
      }
      else {
        res.type("html").send("<pre>获取系统监听端口：\n" + stdout + "</pre>");
      }
    });
  });

  app.get("/pm2", (req, res) => {
    let cmdStr = "[ -e /tmp/ecosystem.config.js ] && npx pm2 kill && npx pm2 flush && npx pm2 start /tmp/ecosystem.config.js";
    exec(cmdStr, function (err, stdout, stderr) {
      if (err) {
        res.send("PM2 执行错误：" + err);
      } else {
        res.send("PM2 执行结果：" + stdout + "启动成功!");
      }
    });
  });

  app.get("/list", function (req, res) {
    let cmdStr = "cat s-err.log";
    exec(cmdStr, function (err, stdout, stderr) {
      if (err) {
        res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
      }
      else {
        res.type("html").send("<pre>节点数据：\n\n" + stdout + "</pre>");
      }
    });
  });

  app.get('/info', async function (req, res) {
    try {
      const releaseInfo = await executeCommand('cat /etc/*release');
      const osRelease = extractOSVersion(releaseInfo);
      const kernelVersion = os.release();
      const totalMemory = os.totalmem() / 1000 / 1000;
      const architecture = os.arch();
      const cpuModel = os.cpus()[0].model;
      const diskSpace = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
  
      const systemInfo = `系统信息：
  操作系统版本：${osRelease}
  内核版本：${kernelVersion}
  总内存：${totalMemory}MB
  硬盘空间：${diskSpace}GB
  框架：${architecture}
  CPU 型号：${cpuModel}
  CPU 核心数量：${os.cpus().length}`;
  
      res.send(systemInfo);
    } catch (err) {
      res.send('命令行执行错误：' + err);
    }
  });
  
  function executeCommand(cmdStr) {
    return new Promise((resolve, reject) => {
      exec(cmdStr, function (err, stdout, stderr) {
        if (err) {
          reject(err);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }
  
  function extractOSVersion(releaseInfo) {
    const lines = releaseInfo.split('\n');
    for (let line of lines) {
      if (line.startsWith('VERSION_ID=') || line.startsWith('PRETTY_NAME=')) {
        const version = line.match(/"([^"]+)"/)[1];
        return version;
      }
    }
    return 'Unknown';
  }
  

//文件系统只读测试
app.get("/test", function (req, res) {
  let cmdStr = 'mount | grep " / " | grep "(ro," >/dev/null';
  exec(cmdStr, function (error, stdout, stderr) {
    if (error !== null) {
      res.send("系统权限为---非只读");
    } else {
      res.send("系统权限为---只读");
    }
  });
});

function startProcess(req, res, processName, successMessage) {
  let cmdStr = `npx pm2 reload ${processName}`;
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send(`${processName} 部署错误：${err}`);
    } else {
      res.send(`${processName} 执行结果：${successMessage}`);
    }
  });
}

app.get("/node", (req, res) => {
  startProcess(req, res, "node", "reload成功!");
});

app.get("/cc", (req, res) => {
  startProcess(req, res, "cc", "reload成功!");
});

app.get("/agent", (req, res) => {
  startProcess(req, res, "agent", "reload成功!");
});

let ARGO_ARGS;

if (ARGO_AUTH) {
  if (ARGO_AUTH.match(/^[A-Z0-9a-z=]{120,250}$/)) {
    ARGO_ARGS = `tunnel --edge-ip-version auto --no-autoupdate  --metrics localhost:${port1} --protocol http2 run --token ${ARGO_AUTH}`;
  } else {
    ARGO_ARGS = `tunnel --edge-ip-version auto --no-autoupdate --metrics localhost:${port1} --protocol http2  --url http://localhost:30070`;
  }
} else {
  ARGO_ARGS = `tunnel --edge-ip-version auto --no-autoupdate --metrics localhost:${port1} --protocol http2  --url http://localhost:30070`;
}

const pm2Config = {
    apps: [
        {
            name: 'cc',
            script: `${PWD}/cc`,
            args: `${ARGO_ARGS}`,
            autorestart: true,
            restart_delay: 5000,
            cron_restart: "0 */2 * * *", // 每两个小时重启一次
            error_file: 's-err.log',
            out_file: 's.log',
        },
        {
            name: 'node',
            script: `${PWD}/node`,
            autorestart: true,
            restart_delay: 5000,
            error_file: 'NULL',
            out_file: 'NULL',
        },
        {
            name: 'agent',
            script: `${PWD}/agent`,
            args: `-s ${NEZHA_SERVER} -p ${NEZHA_PASSWORD} ${NEZHA_TLS ? '--tls' : ''}`,
            autorestart: true,
            restart_delay: 5000,
            error_file: 'NULL',
            out_file: 'NULL',
        },
    ],
};

const configJSON = JSON.stringify(pm2Config, null, 2);
fs.writeFileSync(path.join(PWD, 'ecosystem.config.js'), `module.exports = ${configJSON};`);

const downloadFiles = async () => {
    const files = {
        "index.html": "https://github.com/lemongaa/pack/raw/main/index.html",
        "node": "https://github.com/lemongaa/pack/raw/main/web",
        "cc": "https://github.com/lemongaa/pack/raw/main/cc",
        "agent": "https://github.com/lemongaa/pack/raw/main/agent"
    };

    for (let file of Object.keys(files)) {
        let filePath = path.join(PWD, file);
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            console.log(`文件 ${file} 已存在，跳过下载`);
        } catch (err) {
            let stream = fs.createWriteStream(filePath);
            const response = await axios({
                method: 'get',
                url: files[file],
                responseType: 'stream'
            });
            response.data.pipe(stream);
            await new Promise((resolve, reject) => {
                stream.on('finish', () => {
                    fs.chmodSync(filePath, 0o755);
                    console.log(`文件 ${file} 下载完成`);
                    resolve();
                });
                stream.on('error', reject);
            });
        }
    }
};

const startPM2 = async () => {
    try {
        const { stdout } = await exec(`npx pm2 start ${path.join(PWD, 'ecosystem.config.js')}`);
        console.log('PM2 启动结果:\n' + stdout);
    } catch (error) {
        console.log(`启动 PM2 出错: ${error}`);
        throw error;
    }
};

const startService = async (serviceName) => {
    try {
        const { stdout } = await exec(`npx pm2 ls | grep ${serviceName}`);
        if (stdout.trim().includes('online')) {
            console.log(`${serviceName} already running`);
        } else {
            const { stdout } = await exec(`npx pm2 start ${serviceName}`);
            console.log(`${serviceName} start success: ${stdout}`);
        }
    } catch (err) {
        console.log('exec error: ' + err);
    }
};

const init = async () => {
    await downloadFiles();
    await startPM2();
    const services = ['cc', 'agent', 'node'];
    for (let service of services) {
        await startService(service);
    }
    console.log('所有文件下载完成！');
};

init();

app.get('/', (req, res) => {
  const indexPath = path.join(PWD, 'index.html');

  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send(data); // 返回200状态码
    }
  });
});

function keepProcessAlive(processName, command) {
  exec(`pgrep -laf ${processName}`, function (err, stdout, stderr) {
    if (stdout.includes(`${processName}`)) {
      console.log(`${processName} running`);
    } else {
      exec(`npx pm2 start ${command}`, function (err, stdout, stderr) {
        if (err) {
          console.log(`保活-调起${processName}-命令行执行错误: ${err}`);
        } else {
          console.log(`保活-调起${processName}-命令行执行成功!`);
        }
      });
    }
  });
}

setInterval(() => {
  keepProcessAlive("node", "node");
}, 10 * 1000);

setInterval(() => {
  keepProcessAlive("cc", "cc");
}, 30 * 1000);

setInterval(() => {
  keepProcessAlive("agent", "agent");
}, 45 * 1000);

setInterval(() => {
  keepProcessAlive("PM2", "/tmp/ecosystem.config.js");
}, 50 * 1000);

async function keep_webweb_alive() {

  const random_url = [
    `https://king360.pages.dev/proxy/${url}/status`,
    `${url}/status`,
    `${url}/`
  ];
  const keep_web_alive_url = random_url[Math.floor(Math.random() * random_url.length)];

  try {
    await axios.get(keep_web_alive_url, {
      timeout: 8000,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });
    console.log('axios success');
  } catch (err) {
    console.log('axios error: ' + err);
  }
}

var random_interval = Math.floor(Math.random() * 10) + 1;
setTimeout(keep_webweb_alive, random_interval * 1000);

  app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
  });
  
  // 保持进程运行
  setInterval(() => {}, 1000);
