#!/usr/bin/env node

const assert = require('assert')
const fs = require('fs')
const execFile = require('util').promisify(require('child_process').execFile)
const recordScreen = require('.')
const videoFile = '/tmp/test.mp4'
const recordingOptions = {
  hostname: 'chromedriver'
}
const recordingLength = 2000

function checkVideoIntegrity(videoFile) {
  return execFile('ffmpeg', ['-v', 'error', '-i', videoFile, '-f', 'null', '-'])
}

async function getVideoLength(videoFile) {
  const result = await execFile('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    videoFile
  ])
  return Number(result.stdout.trim())
}

async function testRecording(videoFile, recordingOptions, recordingLength) {
  // Touch the file name to check if the overwrite option works:
  fs.closeSync(fs.openSync(videoFile, 'w'))
  const recording = recordScreen(videoFile, recordingOptions)
  setTimeout(() => recording.stop(), recordingLength)
  await recording.promise
  await checkVideoIntegrity(videoFile)
  const videoLength = await getVideoLength(videoFile)
  const expectedLength = recordingLength / 1000
  if (!(videoLength >= expectedLength)) {
    throw new assert.AssertionError({
      message: 'Recording does not have the expected length.',
      actual: videoLength,
      expected: expectedLength,
      operator: '>='
    })
  }
  fs.unlinkSync(videoFile)
  assert.rejects(
    recordScreen(videoFile, {
      resolution: 'invalid'
    }).promise
  )
  assert.rejects(
    recordScreen(videoFile, {
      fps: 'invalid'
    }).promise
  )
  assert.rejects(
    recordScreen(videoFile, {
      hostname: 'invalid'
    }).promise
  )
  assert.rejects(
    recordScreen(videoFile, {
      display: 'invalid'
    }).promise
  )
  assert.rejects(
    recordScreen(videoFile, {
      pixelFormat: 'invalid'
    }).promise
  )
}

testRecording(videoFile, recordingOptions, recordingLength).catch(err => {
  console.error(err)
  process.exit(1)
})
