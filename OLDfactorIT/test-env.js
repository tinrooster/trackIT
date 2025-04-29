console.log('Node version:', process.version)
console.log('NPM version:', require('child_process').execSync('npm -v').toString())
console.log('Current package manager:', process.env.npm_config_user_agent)