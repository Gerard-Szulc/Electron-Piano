<template>
  <div id="wrapper">
    <div :style="`
    display: flex;
     flex-direction: row;
      width: auto;`">
      <div v-for="frequency in halfNotes"
           :style="`left: ${getLeft(frequency[1]) / 10}%;`"
           :class="{active: pressedKey === frequency[1]}"
           @click="() => startSound(frequency[0])"
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
           @click="() => startSound(frequency[0])"
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
    </select>
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
      this.$nextTick(() => {
        // this.getAnalyser()
        // this.draw()
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
      startSound (note) {
        let freq = freqMap[note]
        this.pressedKey = freq
        this.gainNode = {}
        this.oscillator = {}
        this.freq = {}
        if (freq === undefined) {
          return
        }

        this.oscillator = this.context.createOscillator()
        this.oscillator.type = this.oscillatorType
        this.freq[note] = freq
        this.oscillator.frequency.value = this.freq[note]
        this.gainNode = this.context.createGain()
        this.oscillator.connect(this.gainNode)
        this.gainNode.connect(this.context.destination)

        const duration = 2

        this.gainNode.gain.linearRampToValueAtTime(0.0001, this.context.currentTime + duration)
        this.oscillator.start()
        this.gainNode.connect(this.context.destination)
        this.stopSound(note)
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
        addEventListener('keypress', (key) => {
          this.startSound(keyMap[key.key])
        })
      },
      getLeft (freq) {
        return ((69 + (12 * Math.log2(freq / 440))) * 25) - 1500
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
    top: 50px;
    width:25px; height: 50px;
    border: 1px solid black;
    color: white;
  }
  .fullTone {
    position: absolute;
    top: 100px;
    width: 25px;
    height: 50px;
    border: 1px solid black;
  }
</style>
