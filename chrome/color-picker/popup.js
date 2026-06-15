(function () {
  const pickButton = document.querySelector('#pick')
  const copyButton = document.querySelector('#copy')
  const result = document.querySelector('#result')
  const swatch = document.querySelector('#swatch')
  const rgbOutput = document.querySelector('#rgb')
  const hexOutput = document.querySelector('#hex')
  const status = document.querySelector('#status')
  let currentRgb = ''

  const setStatus = (message) => {
    if (status) {
      status.textContent = message
    }
  }

  const hexToRgb = (hex) => {
    const value = hex.replace('#', '')
    const red = parseInt(value.slice(0, 2), 16)
    const green = parseInt(value.slice(2, 4), 16)
    const blue = parseInt(value.slice(4, 6), 16)

    return `rgb(${red}, ${green}, ${blue})`
  }

  const showColor = (hex) => {
    currentRgb = hexToRgb(hex)

    if (result) {
      result.hidden = false
    }

    if (swatch) {
      swatch.style.background = hex
    }

    if (rgbOutput) {
      rgbOutput.textContent = currentRgb
    }

    if (hexOutput) {
      hexOutput.textContent = hex
    }

    setStatus('Color picked.')
  }

  if (!pickButton || !copyButton || !('EyeDropper' in window)) {
    setStatus('EyeDropper API unavailable in this Chrome version.')
    return
  }

  pickButton.addEventListener('click', async () => {
    try {
      setStatus('Picking...')
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()

      showColor(result.sRGBHex)
    } catch (_error) {
      setStatus('Pick cancelled.')
    }
  })

  copyButton.addEventListener('click', async () => {
    if (!currentRgb) {
      return
    }

    try {
      await navigator.clipboard.writeText(currentRgb)
      setStatus('RGB copied.')
    } catch (_error) {
      setStatus('Copy failed.')
    }
  })
}())
