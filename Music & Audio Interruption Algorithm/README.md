# Music & Audio Interruption Algorithm

## Introduction

When dealing with situations such as ffmpeg audio modulation or pause/resume actions, an ffmpeg-like backend might not handle it effectively due to the lack of **breakpoint timestamp recording**. This algorithm is designed to address these issues. Additionally, it is adaptable for media that can be viewed as a sequence of frames, such as videos.

## Explanation

### Fundamental Concepts

1. We use the built-in CPU clock which monitors the time elapsed since the music starts playing. This clock giving the current time is called `clockCurrent`, hereinafter referred to as `clockCR`, while the clock at the moment the music starts playing is called `clockStartpoint`, referred to as `clockSP`.

2. `clockStartpoint := clockCurrent` is always assigned at the very moment the music starts or restarts playing. This is true for both initial play and mid-play resumption (breakpoint).

3. `ps-rs` is an abbreviation for `pause-resume`. It is used to indicate the time sequence relationship between the interface signal and the media service. The explaniation of PS-RS model is provided below.

### PS-RS Model

- There are three variables in total: `start_timestamp`, `clockCR`, `clockSP`. `start_timestamp` is used by ffmpeg-like backends to play the audio from a specific timestamp.

- Sequence Diagram  
  <img src=".blob/ps-rs model.jpg" alt="ps-rs model" width="200"/>

- `x: start_time += clockCR - clockSP`
- `y: clockSP := clockCR`

- We then use timer diagram for further explanation.  
  <img src=".blob/ps-rs model timer diagram.jpg" alt="timer diagram" width="800"/>

## Case Check

### Case 1

1. pause at 5s.
2. wait for 10s.
3. resume, then pause again after another 5s.
4. wait for 10s.
5. resume.

### Case 2 (Special Case)

1. pause at 5s.
2. resume immediately after pausing. (indicating a 0-second ps-rs interval)
3. pause again after 5s.
4. resume immediately after pausing again.
