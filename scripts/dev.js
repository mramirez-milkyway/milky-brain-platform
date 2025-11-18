// scripts/dev.js
const { spawn } = require('child_process')

const child = spawn('turbo', ['dev'], {
  stdio: 'inherit',
  shell: true,
})

const forward = (signal) => {
  if (child.pid) {
    process.kill(child.pid, signal)
  }
}

process.on('SIGINT', () => forward('SIGINT'))
process.on('SIGTERM', () => forward('SIGTERM'))
