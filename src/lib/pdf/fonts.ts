import { Font } from '@react-pdf/renderer'

const archivo400 = '/fonts/archivo-400.woff'
const archivo700 = '/fonts/archivo-700.woff'
const serif400 = '/fonts/source-serif-4-400.woff'
const serif400i = '/fonts/source-serif-4-400-italic.woff'
const serif700 = '/fonts/source-serif-4-700.woff'
const mono400 = '/fonts/jetbrains-mono-400.woff'

let registered = false

/** Register brand fonts once. Idempotent. */
export function ensureFonts() {
  if (registered) return
  Font.register({
    family: 'Archivo',
    fonts: [
      { src: archivo400, fontWeight: 400 },
      { src: archivo700, fontWeight: 700 },
    ],
  })
  Font.register({
    family: 'SourceSerif',
    fonts: [
      { src: serif400, fontWeight: 400 },
      { src: serif400i, fontWeight: 400, fontStyle: 'italic' },
      { src: serif700, fontWeight: 700 },
    ],
  })
  Font.register({
    family: 'JetBrainsMono',
    fonts: [{ src: mono400, fontWeight: 400 }],
  })
  // Prevent react-pdf's default hyphenation from splitting brand words.
  Font.registerHyphenationCallback((word) => [word])
  registered = true
}
