'use strict'

/* global describe, after, it */

/**
 * @typedef {object} MetaData Video stream meta data
 * @property {number} duration Video duration
 * @property {number} width Video width
 * @property {number} height Video height
 * @property {number} rotate Video rotation value
 */

/** @type {object} */
const assert = require('assert')
const fs = require('fs')
const execFile = require('util').promisify(require('child_process').execFile)
const recordScreen = require('.')

const mochaTimeout = 10000
const mochaSlow = 5000

const videoFile = '/tmp/test.mp4'
const recordingDuration = 2000

/**
 * Checks the integrity of the given video file.
 *
 * @param {string} videoFile File path to the video file
 * @returns {Promise} Resolves for a valid file, rejects otherwise
 */
function checkVideoIntegrity(videoFile) {
  return execFile('ffmpeg', ['-v', 'error', '-i', videoFile, '-f', 'null', '-'])
}

/**
 * Checks the integrity of the given video file.
 *
 * @param {string} videoFile File path to the video file
 * @returns {Promise<MetaData>} Resolves with the video meta data
 */
async function getVideoMetaData(videoFile) {
  const result = await execFile('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration:stream=width,height:stream_tags=rotate',
    '-of',
    'json',
    videoFile
  ])
  const parsedResult = JSON.parse(result.stdout)
  const rotate = parsedResult.streams[0].tags.rotate
  return {
    duration: Number(parsedResult.format.duration),
    width: parsedResult.streams[0].width,
    height: parsedResult.streams[0].height,
    rotate: rotate === undefined ? rotate : Number(rotate)
  }
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
      'ffmpeg -y -r 15 -f x11grab -i :0 -pix_fmt yuv420p ' + videoFile
    )
  })

  it('handles option: loglevel', async function () {
    const recording = recordScreen(videoFile, {
      loglevel: 'quiet'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -loglevel quiet -r 15 -f x11grab -i :0 -pix_fmt yuv420p ' +
        videoFile
    )
    const recording2 = recordScreen(videoFile, {
      loglevel: null
    })
    const cmd2 = await recording2.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd2,
      'ffmpeg -y -r 15 -f x11grab -i :0 -pix_fmt yuv420p ' + videoFile
    )
  })

  it('handles option: inputFormat', async function () {
    const recording = recordScreen(videoFile, {
      inputFormat: 'mjpeg'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f mjpeg -i http://localhost:9000/ -pix_fmt yuv420p ' +
        videoFile
    )
    const recording2 = recordScreen(videoFile, {
      inputFormat: null
    })
    const cmd2 = await recording2.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd2,
      'ffmpeg -y -r 15 -i http://localhost:9000/ -pix_fmt yuv420p ' + videoFile
    )
  })

  it('handles option: resolution', async function () {
    const recording = recordScreen(videoFile, {
      resolution: '1440x900'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y ' +
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
      'ffmpeg -y -r 30 -f x11grab -i :0 -pix_fmt yuv420p ' + videoFile
    )
    const recording2 = recordScreen(videoFile, {
      fps: null
    })
    const cmd2 = await recording2.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd2,
      'ffmpeg -y -f x11grab -i :0 -pix_fmt yuv420p ' + videoFile
    )
  })

  it('handles option: videoCodec', async function () {
    const recording = recordScreen(videoFile, {
      videoCodec: 'libx264'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f x11grab -i :0 -vcodec libx264 -pix_fmt yuv420p ' +
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
      'ffmpeg -y -r 15 -f x11grab -i :0 -pix_fmt yuv444p ' + videoFile
    )
    const recording2 = recordScreen(videoFile, {
      pixelFormat: null
    })
    const cmd2 = await recording2.promise.catch(error => error.cmd)
    assert.strictEqual(cmd2, 'ffmpeg -y -r 15 -f x11grab -i :0 ' + videoFile)
  })

  it('handles option: hostname', async function () {
    const recording = recordScreen(videoFile, {
      hostname: '127.0.0.1'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f x11grab -i 127.0.0.1:0 -pix_fmt yuv420p ' + videoFile
    )
  })

  it('handles option: display', async function () {
    const recording = recordScreen(videoFile, {
      display: '0.0+100,100'
    })
    const cmd = await recording.promise.catch(error => error.cmd)
    assert.strictEqual(
      cmd,
      'ffmpeg -y -r 15 -f x11grab -i :0.0+100,100 -pix_fmt yuv420p ' + videoFile
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
      'ffmpeg -y -r 15 -f mjpeg -i https://localhost:9000/ -pix_fmt yuv420p ' +
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
      'ffmpeg -y -r 15 -f mjpeg -i http://localhost:8080/ -pix_fmt yuv420p ' +
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
      'ffmpeg -y ' +
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
      'ffmpeg -y ' +
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
      'ffmpeg -y ' +
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
      'ffmpeg -y ' +
        '-r 15 -f mjpeg -i http://user:pass@localhost:9000/ -pix_fmt yuv420p ' +
        videoFile
    )
  })

  it('records screen: x11grab', async function () {
    // Touch the file name to check if the overwrite option works:
    fs.closeSync(fs.openSync(videoFile, 'w'))
    const options = {
      hostname: process.env.X11_HOST,
      resolution: '1440x900'
    }
    const recording = recordScreen(videoFile, options)
    setTimeout(() => recording.stop(), recordingDuration)
    await recording.promise
    await checkVideoIntegrity(videoFile)
    const videoMetaData = await getVideoMetaData(videoFile)
    const expectedDuration = recordingDuration / 1000
    if (!(videoMetaData.duration >= expectedDuration)) {
      throw new assert.AssertionError({
        message: 'Recording does not have the expected length.',
        actual: videoMetaData.duration,
        expected: expectedDuration,
        operator: '>='
      })
    }
    const resolution = videoMetaData.width + 'x' + videoMetaData.height
    if (resolution !== options.resolution) {
      throw new assert.AssertionError({
        message: 'Recording does not have the expected resolution.',
        actual: resolution,
        expected: options.resolution,
        operator: '==='
      })
    }
  })

  it('records screen: mjpeg', async function () {
    // Touch the file name to check if the overwrite option works:
    fs.closeSync(fs.openSync(videoFile, 'w'))
    const recording = recordScreen(videoFile, {
      hostname: process.env.MJPEG_HOST,
      inputFormat: 'mjpeg'
    })
    setTimeout(() => recording.stop(), recordingDuration + 300)
    await recording.promise
    await checkVideoIntegrity(videoFile)
    const videoMetaData = await getVideoMetaData(videoFile)
    const expectedDuration = recordingDuration / 1000
    if (!(videoMetaData.duration >= expectedDuration)) {
      throw new assert.AssertionError({
        message: 'Recording does not have the expected length.',
        actual: videoMetaData.duration,
        expected: expectedDuration,
        operator: '>='
      })
    }
  })

  it('uses filter: crop', async function () {
    const recording = recordScreen(videoFile, {
      hostname: process.env.X11_HOST,
      resolution: '1440x900',
      // See https://ffmpeg.org/ffmpeg-filters.html#crop
      videoFilter: 'crop=480:300:960:600'
    })
    setTimeout(() => recording.stop(), recordingDuration)
    await recording.promise
    await checkVideoIntegrity(videoFile)
    const videoMetaData = await getVideoMetaData(videoFile)
    const expectedDuration = recordingDuration / 1000
    if (!(videoMetaData.duration >= expectedDuration)) {
      throw new assert.AssertionError({
        message: 'Recording does not have the expected length.',
        actual: videoMetaData.duration,
        expected: expectedDuration,
        operator: '>='
      })
    }
    const resolution = videoMetaData.width + 'x' + videoMetaData.height
    if (resolution !== '480x300') {
      throw new assert.AssertionError({
        message: 'Recording does not have the expected resolution.',
        actual: resolution,
        expected: '480x300',
        operator: '==='
      })
    }
  })

  it('sets metadata: rotate', async function () {
    const recording = recordScreen(videoFile, {
      hostname: process.env.X11_HOST,
      resolution: '1440x900',
      rotate: 90
    })
    setTimeout(() => recording.stop(), recordingDuration)
    await recording.promise
    await checkVideoIntegrity(videoFile)
    const videoMetaData = await getVideoMetaData(videoFile)
    const expectedDuration = recordingDuration / 1000
    if (!(videoMetaData.duration >= expectedDuration)) {
      throw new assert.AssertionError({
        message: 'Recording does not have the expected length.',
        actual: videoMetaData.duration,
        expected: expectedDuration,
        operator: '>='
      })
    }
    // Rotate metadata is always (360 - options.rotate):
    assert.strictEqual(360 - 90, videoMetaData.rotate)
  })
})
