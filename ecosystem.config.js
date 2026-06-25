const NODE_VERSION = 'v18'
const NVM_NODE_PATH = `/home/ubuntu/.nvm/versions/node/v${NODE_VERSION}/bin/node`

const fs = require('fs')
const nodePath = fs.existsSync(NVM_NODE_PATH) ? NVM_NODE_PATH : process.execPath

module.exports = {
  apps: [
    {
      name: 'api',
      script: './bundle.cjs',
      interpreter: nodePath,
      env: {
        NODE_ENV: 'production',
        PORT: 39005
      },
    },
  ],
}
