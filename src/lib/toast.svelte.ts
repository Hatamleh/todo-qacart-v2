/** One snackbar at a time, like Flutter's `hideCurrentSnackBar()..showSnackBar()`. */
export const toast = $state({ message: '', id: 0 })

let timer: ReturnType<typeof setTimeout> | undefined

export function showToast(message: string) {
  toast.message = message
  toast.id++
  clearTimeout(timer)
  timer = setTimeout(() => (toast.message = ''), 4000)
}
