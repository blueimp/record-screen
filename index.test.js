'use strict'

/* global describe, after, it */

const assert = require('assert')
const fs = require('fs')
const execFile = require('util').promisify(require('child_process').execFile)
const recordScreen = require('.')

const mochaTimeout = 10000
const mochaSlow = 5000

const videoFile = '/tmp/test.mp4'
const recordingLength = 2000

function checkVideoIntegrity (videoFile) {
  return execFile('ffmpeg', ['-v', 'error', '-i', videoFile, '-f', 'null', '-'])
}

async function getVideoLength (videoFile) {
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

describe('screen recording', function () {
  this.timeout(mochaTimeout)
  this.slow(mochaSlow)

  after(function () {
    fs.unlinkSync(videoFile)
  })

  it('uses default options', async function () {
    const recording = recordScreen(videoFile)
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f x11grab -i :0 -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: inputFormat', async function () {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f mjpeg -i http://localhost:9000/ -pix_fmt yuv420p ' +
        videoFile
    )
    const recording2 = recordScreen(videoFile, {
      inputFormat: null
    })
    const cmd2 = await recording2.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd2,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -i http://localhost:9000/ -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: resolution', async function () {
    const recording = recordScreen(videoFile, {
      resolution: '1440x900'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-video_size 1440x900 -r 15 -f x11grab -i :0 -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: fps', async function () {
    const recording = recordScreen(videoFile, {
      fps: 30
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 30 -f x11grab -i :0 -pix_fmt yuv420p ' +
        videoFile
    )
    const recording2 = recordScreen(videoFile, {
      fps: null
    })
    const cmd2 = await recording2.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd2,
      'ffmpeg -y -loglevel fatal ' +
        '-f x11grab -i :0 -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: videoCodec', async function () {
    const recording = recordScreen(videoFile, {
      videoCodec: 'libx264'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f x11grab -i :0 -vcodec libx264 -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: pixelFormat', async function () {
    const recording = recordScreen(videoFile, {
      pixelFormat: 'yuv444p'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f x11grab -i :0 -pix_fmt yuv444p ' +
        videoFile
    )
    const recording2 = recordScreen(videoFile, {
      pixelFormat: null
    })
    const cmd2 = await recording2.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd2,
      'ffmpeg -y -loglevel fatal ' + '-r 15 -f x11grab -i :0 ' + videoFile
    )
  })

  it('handles option: hostname', async function () {
    const recording = recordScreen(videoFile, {
      hostname: '127.0.0.1'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f x11grab -i 127.0.0.1:0 -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: display', async function () {
    const recording = recordScreen(videoFile, {
      display: '0.0+100,100'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f x11grab -i :0.0+100,100 -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: protocol', async function () {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      protocol: 'https'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f mjpeg -i https://localhost:9000/ -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: port', async function () {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      port: 8080
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f mjpeg -i http://localhost:8080/ -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: pathname', async function () {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      pathname: '/mjpeg'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f mjpeg -i http://localhost:9000/mjpeg -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: search', async function () {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      search: 'key=val'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f mjpeg -i http://localhost:9000/?key=val -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: username', async function () {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      username: 'user'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f mjpeg -i http://user@localhost:9000/ -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('handles option: password', async function () {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg',
      username: 'user',
      password: 'pass'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel fatal ' +
        '-r 15 -f mjpeg -i http://user:pass@localhost:9000/ -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('records screen', async function () {
    // Touch the file name to check if the overwrite option works:
    fs.closeSync(fs.openSync(videoFile, 'w'))
    const recording = recordScreen(videoFile, {
      hostname: process.env.X11_HOST,
      resolution: '1440x900'
    })
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
  })
})
