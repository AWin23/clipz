import { Injectable } from '@angular/core';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

@Injectable({
  providedIn: 'root'
})
export class FfmpegService {
  isRunning = false
  isReady = false // flag to indidcate if its ready
  private ffmpeg

  constructor() {
    this.ffmpeg = createFFmpeg({ log: true })
  }

  async init() {
    // is ready proerty is true
    if (this.isReady) {
      return
    }

    await this.ffmpeg.load()

    this.isReady = true
  }

  // gets/loads screenshots? 
  async getScreenshots(file: File) {
    this.isRunning = true
    const data = await fetchFile(file)

    this.ffmpeg.FS('writeFile', file.name, data) // writes new file to a file system thru ffmpeg

    const seconds = [1, 2, 3]
    const commands: string[] = []

    seconds.forEach(second => {
      commands.push(
        // Input
        '-i', file.name,

        // Output Options
        '-ss', `00:00:0${second}`,
        '-frames:v', '1',
        '-filter:v', 'scale=510:-1',

        // Output
        `output_0${second}.png`
      )
    })

    await this.ffmpeg.run(
      ...commands
    )

    const screenshots: string[] = []

    // loop thru the seconds array
    seconds.forEach(second => {
      const screenshotFile = this.ffmpeg.FS(
        'readFile', `output_0${second}.png`
      ) // grab fiels from fiel system

      const screenshotBlob = new Blob(
        [screenshotFile.buffer], {
        type: 'image/png'
      }
      )

      const screenshotURL = URL.createObjectURL(screenshotBlob) // this object creastes a URL to a blob
      // this URL can be used to render a file in the browser

      screenshots.push(screenshotURL)
    })

    this.isRunning = false

    return screenshots
  }

  // creates a Blob from a URL (blobs are Objects that acts as a wrapper around a FIle's binary data)
  async blobFromURL(url: string) {
    const response = await fetch(url)
    const blob = await response.blob()

    return blob
  }
}

