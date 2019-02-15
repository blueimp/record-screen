'use strict'

/*
 * Screen recording function using ffmpeg x11grab.
 *
 * Copyright 2019, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

const { execFile } = require('child_process')

/**
 * @typedef {Object} ScreenRecording
 * @property {Promise} promise Promise object for the active screen recording
 * @property {function} stop Function to stop the screen recording
 */

/**
 * Starts a screen recording via ffmpeg x11grab.
 * @param {string} fileName Output file name
 * @param {Object} [options] Screen recording options
 * @property {string} [options.resolution=1440x900] Display resolution
 * @property {number} [options.fps=15] Frames per second
 * @property {string} [options.hostname=localhost] X11 server hostname
 * @property {string} [options.display=0] X11 server display
 * @property {string} [options.pixelFormat=yuv420p] Output pixel format
 * @returns {ScreenRecording}
 */
function recordScreen(fileName, options = {}) {
  let process
  const promise = new Promise(function(resolve, reject) {
    process = execFile(
      'ffmpeg',
      [
        '-y', // Override existing files
        '-loglevel',
        'fatal', // Only show errors that prevent ffmpeg to continue
        '-video_size',
        options.resolution || '1440x900', // Must match X11 display resolution
        '-r', // Frames per second to grab from input
        options.fps || 15,
        '-f', // Forces input format
        'x11grab', // Use X11 as video input device
        '-i', // Defines Input URL
        (options.hostname || '') + ':' + (options.display || '0'),
        '-pix_fmt',
        options.pixelFormat || 'yuv420p', // QuickTime compatibility
        fileName
      ],
      function(error, stdout, stderr) {
        // ffmpeg returns with status 255 when receiving SIGINT:
        if (error && !(error.killed && error.code === 255)) return reject(error)
        return resolve({ stdout, stderr })
      }
    )
  })
  function stop() {
    if (process) process.kill('SIGINT')
  }
  return {
    promise,
    stop
  }
}

module.exports = recordScreen
