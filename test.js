#!/usr/bin/env node

const fs = require('fs')
const execFile = require('util').promisify(require('child_process').execFile)
const recordScreen = require('.')
const videoFile = '/tmp/test.mp4'
const recordingLength = 2000

function checkVideoIntegrity(videoFile) {
  return execFile('ffmpeg', ['-v', 'error', '-i', videoFile, '-f', 'null', '-'])
}

async function main() {
  const recording = recordScreen(videoFile, {
    hostname: 'chromedriver'
  })
  setTimeout(() => recording.stop(), recordingLength)
  await recording.promise
  await checkVideoIntegrity(videoFile)
  fs.unlinkSync(videoFile)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
