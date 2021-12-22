

export class MediaStreamHelper {
  
  // Audio
  //
  public static disableAudio(mediaStream: MediaStream) {
    mediaStream.getAudioTracks().forEach((track: MediaStreamTrack) => { track.enabled = false; })
  }
  public static enableAudio(mediaStream: MediaStream) {
    mediaStream.getAudioTracks().forEach((track: MediaStreamTrack) => { track.enabled = true; })
  }
  public static isAudioEnabled(mediaStream: MediaStream): boolean {
    for (const track of mediaStream.getAudioTracks()) {
      if (track.enabled) return true;
    }
    return false;
  }

  // Video
  //
  public static disableVideo(mediaStream: MediaStream) {
    mediaStream.getVideoTracks().forEach((track: MediaStreamTrack) => { track.enabled = false; })
  }
  public static enableVideo(mediaStream: MediaStream) {
    mediaStream.getVideoTracks().forEach((track: MediaStreamTrack) => { track.enabled = true; })
  }
  public static isVideoEnabled(mediaStream: MediaStream): boolean {
    for (const track of mediaStream.getVideoTracks()) {
      if (track.enabled) return true;
    }
    return false;
  }
}