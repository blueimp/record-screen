# Record Screen
> Screen recording function using [FFmpeg](https://www.ffmpeg.org/) `x11grab`.

## Requirements
This is a thin wrapper around [FFmpeg](https://www.ffmpeg.org/) and has no other
dependencies.

## Installation
```sh
npm install record-screen
```

## Usage
```js
const recordScreen = require('record-screen')

const options = {
  resolution: '1440x900', // Display resolution
  fps: 15,                // Frames per second
  hostname: 'localhost',  // X11 server hostname
  display: '0',           // X11 server display
  pixelFormat: 'yuv420p'  // Output pixel format
}

const recording = recordScreen('/tmp/test.mp4', options)

recording.promise
  .then(result => {
    // Screen recording is done
  })
  .catch(error => {
    // Screen recording has failed
  })

// As an example, stop the screen recording after 5 seconds:
setTimeout(() => recording.stop(), 5000)
```

## License
Released under the [MIT license](https://opensource.org/licenses/MIT).

## Author
[Sebastian Tschan](https://blueimp.net/)
