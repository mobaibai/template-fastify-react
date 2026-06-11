const NODE_VERSION = '22'
const NVM_NODE_PATH = `/root/.nvm/versions/node/v${NODE_VERSION}/bin/node`

const fs = require('fs')
const nodePath = fs.existsSync(NVM_NODE_PATH) ? NVM_NODE_PATH : process.execPath

module.exports = {
  apps: [
    {
      name: 'api',
      script: './server.cjs',
      interpreter: nodePath,
      env: { NODE_ENV: 'production' },
    },
  ],
}
