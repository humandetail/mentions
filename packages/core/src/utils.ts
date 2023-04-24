import { MentionOption } from '../types/vue-mentions'
export const getMatchMention = (options: MentionOption[], input: string) => {
  let match = null
  let option = null
  for (let i = 0; i < options.length; i++) {
    match = input.match(new RegExp(`^@${options[i].label}\\s{1}?`))

    if (match) {
      option = options[i]
      break
    }
  }

  return option
}
