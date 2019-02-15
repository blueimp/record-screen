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
        '-loglevel',
        'error',
        '-y', // Override existing files
        fileName
      ],
      function(error, stdout, stderr) {
        process = null
        if (error) {
          // At the start, the video capture always logs an ignorable x11grab
          // "image data event_error", which we can safely ignore:
          const stderrLines = stderr.split('\n')
          if (
            stderrLines.length !== 2 ||
            !/x11grab .* image data event_error/.test(stderrLines[0])
          ) {
            return reject(error)
          }
        }
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
