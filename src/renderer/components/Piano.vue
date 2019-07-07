<template>
  <div id="wrapper">
    <canvas ref="canvas" id="oscilloscope"></canvas>
    <div :style="`
    display: flex;
     flex-direction: row;
      width: auto;`">
      <div v-for="frequency in halfNotes"
           :style="`left: ${getLeft(frequency[1]) / 10}%;`"
           :class="{active: pressedKey === frequency[1]}"
           @click="() => startSound(frequency[1])"
           class="not-active halfTone"
      >
      {{frequency[0]}}
      </div>
    </div>
    <div :style="`
    display: flex;
     flex-direction:row;
      width: auto;`">
      <div v-for="frequency in fullNotes"
           :style="` left: ${getLeft(frequency[1]) / 10}%; `"
           :class="{active: pressedKey === frequency[1]}"
           @click="() => startSound(frequency[1])"
           class="fullTone"
      >
      {{frequency[0]}}
      </div>
    </div>
    <select v-model="oscillatorType">
      <option value="sine">sine</option>
      <option value="square">square</option>
      <option value="triangle">triangle</option>
      <option value="sawtooth">sawtooth</option>
      <option value="custom">custom</option>
    </select>
    <div v-if="oscillatorType === 'custom'">
      <label for="attack">Attack</label>
      <input name="attack" id="attack" type="range" min="0" max="1" step="0.1" v-model="attackValue"/>

      <label for="release">Release</label>
      <input name="release" id="release" type="range" min="0" max="1" step="0.1" v-model="releaseValue"/>
      <label for="release">SweepLength</label>
      <input name="release" id="sweep" type="range" min="0" max="10" step="0.1" v-model="sweepLength"/>

      <input id="freq0" type="range" min="-1" max="1" v-model="rangeChanges['0']" step="0.05">
      <input id="freq1" type="range" min="-1" max="1" v-model="rangeChanges['1']" step="0.05">
      <input id="freq2" type="range" min="-1" max="1" v-model="rangeChanges['2']" step="0.05">
      <input id="freq3" type="range" min="-1" max="1" v-model="rangeChanges['3']" step="0.05">
      <input id="freq4" type="range" min="-1" max="1" v-model="rangeChanges['4']" step="0.05">
      <input id="freq5" type="range" min="-1" max="1" v-model="rangeChanges['5']" step="0.05">
      <input id="freq6" type="range" min="-1" max="1" v-model="rangeChanges['6']" step="0.05">
    </div>
  </div>

</template>

<script>
  import keyMap from '../../utils/keys'
  import freqMap from '../../utils/frequencies'
  import SystemInformation from './LandingPage/SystemInformation'
  // import fs from 'fs'

  export default {
    name: 'landing-page',
    components: { SystemInformation },
    data () {
      return {
        attackValue: 0.2,
        releaseValue: 0.5,
        sweepLength: 2,
        rangeChanges: {
          0: 0,
          1: 0.5,
          2: 0.5,
          3: 0.5,
          4: 0.5,
          5: 0.5,
          6: 0.5
        },
        freqMap: freqMap,
        keys: {},
        pressedKey: 0,
        oscillatorType: 'sine',
        analyser: null,
        bufferLength: null,
        canvas: null,
        canvasContext: null,
        context: null,
        dataArray: null,
        oscillator: null,
        gainNode: null,
        freq: null
      }
    },
    mounted () {
      this.getAudio()
      this.getMidiAccess()
      this.$nextTick(() => {
      })
    },
    beforeDestroy () {
      removeEventListener('keypress', (key) => {
        this.startSound(key)
      })
    },
    computed: {
      freqMapArray () {
        return Object.entries(this.freqMap)
          .filter(element => element[0].includes('4') || element[0].includes('5') || element[0].includes('6'))
          .filter(e => !e[0].includes('b'))
      },
      fullNotes () {
        return this.freqMapArray.filter(element => !element[0].includes('#'))
      },
      halfNotes () {
        return this.freqMapArray.filter(element => element[0].includes('#'))
      },
      width () {
        return this.getLeft(this.freqMapArray[this.freqMapArray.length - 1][1])
      },
      widthFull () {
        return this.fullNotes[this.fullNotes.length - 1][1] - this.firstFullFreq
      },
      widthHalf () {
        return this.halfNotes[this.halfNotes.length - 1][1] - this.firstHalfFreq
      },
      fullelementWidth () {
        return this.widthFull / this.halfNotes.length
      },
      halfelementWidth () {
        return this.widthHalf / this.fullNotes.length
      },
      firstFullFreq () {
        return this.fullNotes[0][1]
      },
      firstHalfFreq () {
        return this.halfNotes[0][1]
      },
      number () {
        return 69 + (12 * Math.log2(this.pressedKey / 440))
      }
      // marginL () {
      //   return
      // }
    },
    methods: {
      startSound (freq) {
        this.pressedKey = this.round(freq, 2)
        this.gainNode = {}
        this.oscillator = {}
        this.freq = {}
        if (freq === undefined) {
          return
        }

        this.oscillator = this.context.createOscillator()
        if (this.oscillatorType === 'custom') {
          this.setCustomWaveForm(this.context, this.oscillator)
        } else {
          this.oscillator.type = this.oscillatorType
        }
        this.gainNode = this.context.createGain()
        this.gainNode.connect(this.analyser)
        this.analyser.connect(this.context.destination)

        this.freq[this.round(freq, 2)] = this.round(freq, 2)
        this.oscillator.frequency.value = this.freq[this.round(freq, 2)]
        this.oscillator.connect(this.gainNode)
        this.gainNode.connect(this.context.destination)

        const duration = 2

        if (this.oscillatorType === 'custom') {
          this.setSweepAndRelease()
        } else {
          this.gainNode.gain.linearRampToValueAtTime(0.0002, this.context.currentTime + duration)
        }
        this.oscillator.start()
        this.gainNode.connect(this.context.destination)
        this.stopSound(this.round(freq, 2))
      },
      stopSound (index) {
        const duration = 2
        if (this.oscillator) {
          this.oscillator.stop(this.context.currentTime + duration)
        }
      },
      getAudio () {
        this.context = new AudioContext()
        this.context.createBuffer(2, 22050, 44100)
        this.gainNode = {}
        this.oscillator = {}
        this.freq = {}
        this.analyser = this.context.createAnalyser()
        this.analyser.fftSize = 2048
        this.bufferLength = this.analyser.frequencyBinCount
        this.dataArray = new Uint8Array(this.bufferLength)
        this.analyser.getByteTimeDomainData(this.dataArray)

        this.canvas = document.getElementById('oscilloscope')
        this.canvasContext = this.canvas.getContext('2d')
        this.draw()

        addEventListener('keypress', (key) => {
          this.startSound(freqMap[keyMap[key.key]])
        })
      },
      setCustomWaveForm (context, oscillator) {
        let imag = new Float32Array([this.rangeChanges[0], this.rangeChanges[1], this.rangeChanges[2], this.rangeChanges[3], this.rangeChanges[4], this.rangeChanges[5], this.rangeChanges[6]])
        let real = new Float32Array(imag.length)
        // let imag = new Float32Array([this.rangeChanges[0], this.rangeChanges[1], this.rangeChanges[2], this.rangeChanges[3], this.rangeChanges[4], this.rangeChanges[5], this.rangeChanges[6]])
        let customWave = context.createPeriodicWave(real, imag)
        oscillator.setPeriodicWave(customWave)
      },
      setSweepAndRelease () {
        this.gainNode.gain.linearRampToValueAtTime(1, this.context.currentTime + this.round(this.attackValue, 2))
        // set our release
        this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + this.round(this.sweepLength - this.releaseValue, 2))
      },
      getMidiAccess () {
        if (navigator.requestMIDIAccess()) {
          console.log('This browser supports WebMIDI!')

          let onMIDISuccess = function (midiAccess, context) {
            console.log(midiAccess)

            let inputs = midiAccess.inputs
            let outputs = midiAccess.outputs
            console.log(inputs, outputs)
            for (let input of inputs.values()) {
              input.onmidimessage = function (message) {
                var command = message.data[0]
                var note = message.data[1]
                var velocity = (message.data.length > 2) ? message.data[2] : 0 // a velocity value might not be included with a noteOff command

                switch (command) {
                  case 144: // noteOn
                    if (velocity > 0) {
                      context.startSound(context.noteOn(note, velocity))
                    } else {
                      context.noteOff(note)
                    }
                    break
                  case 128: // noteOff
                    context.noteOff(note)
                    break
                }
              }
            }
          }

          let onMIDIFailure = function () {
            console.log('Could not access your MIDI devices.')
          }

          navigator.requestMIDIAccess()
            .then((message) => onMIDISuccess(message, this), onMIDIFailure)
        } else {
          console.log('WebMIDI is not supported in this browser.')
        }
      },
      getLeft (freq) {
        return ((69 + (12 * Math.log2(freq / 440))) * 25) - 1500
      },
      noteOn (midiKey) {
        return 440 / Math.pow(2, (69 - midiKey) / 12)
      },
      noteOff (midiKey) {
        this.stopSound(midiKey)
      },
      round (n, k) {
        let factor = Math.pow(10, k)
        return Math.round(n * factor) / factor
      },
      draw () {
        requestAnimationFrame(this.draw)

        this.analyser.getByteTimeDomainData(this.dataArray)

        this.canvasContext.fillStyle = 'rgb(200, 200, 200)'
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.canvasContext.lineWidth = 2
        this.canvasContext.strokeStyle = 'rgb(0, 0, 0)'

        this.canvasContext.beginPath()

        var sliceWidth = this.canvas.width * 1.0 / this.bufferLength
        var x = 0

        for (var i = 0; i < this.bufferLength; i++) {
          var v = this.dataArray[i] / 128.0
          var y = v * this.canvas.height / 2

          if (i === 0) {
            this.canvasContext.moveTo(x, y)
          } else {
            this.canvasContext.lineTo(x, y)
          }

          x += sliceWidth
        }

        this.canvasContext.lineTo(this.canvas.width, this.canvas.height / 2)
        this.canvasContext.stroke()
      }
    }
  }
</script>

<style>

  div.active {
    background: #42b983;
  }
  .not-active {
    background-color: black;
  }
  .halfTone {
    position: absolute;
    top: 450px;
    width:25px; height: 50px;
    border: 1px solid black;
    color: white;
  }
  .fullTone {
    position: absolute;
    top: 500px;
    width: 25px;
    height: 50px;
    border: 1px solid black;
  }
</style>
